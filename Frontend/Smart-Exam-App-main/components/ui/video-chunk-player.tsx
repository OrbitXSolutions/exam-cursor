"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  AlertCircle,
  RotateCcw,
} from "lucide-react"

interface ChunkInfo {
  index: number
  filename: string
  sizeBytes: number
}

interface ChunkListResponse {
  attemptId: number
  totalChunks: number
  totalSizeBytes: number
  chunkDurationMs: number
  chunks: ChunkInfo[]
  mimeType?: string
}

interface VideoChunkPlayerProps {
  attemptId: number
  className?: string
}

// MSE codec candidates in priority order.
// VP9+opus and VP8+opus cover the common Chrome/Firefox MediaRecorder output (video+mic audio).
const PLAYBACK_CODECS = [
  'video/webm; codecs="vp9, opus"',
  'video/webm; codecs="vp8, opus"',
  'video/webm; codecs="vp9"',
  'video/webm; codecs="vp8, vorbis"',
  'video/webm; codecs="vp8"',
  'video/webm',
]

export function VideoChunkPlayer({ attemptId, className = "" }: VideoChunkPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [chunkData, setChunkData] = useState<ChunkListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0) // 0-100

  const tokenRef = useRef<string>("")
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const appendedChunksRef = useRef<number>(0)
  const allBufferedRef = useRef(false)

  // Build chunk URL
  const getChunkUrl = useCallback(
    (filename: string) => {
      return `/api/video-chunks/${attemptId}/${filename}?token=${encodeURIComponent(tokenRef.current)}`
    },
    [attemptId],
  )

  // Fetch chunk list on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    tokenRef.current = token || ""

    async function fetchChunks() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/video-chunks/${attemptId}?token=${encodeURIComponent(token || "")}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || body?.error || `Failed to load chunks (${res.status})`)
        }
        const json = await res.json()
        const data: ChunkListResponse = json.data || json
        setChunkData(data)
      } catch (err: any) {
        setError(err?.message || "Failed to load video chunks")
      } finally {
        setLoading(false)
      }
    }

    if (attemptId) fetchChunks()
  }, [attemptId])

  // Set up MSE with codec auto-detect and retry logic.
  // If chunk 0 (the EBML init segment) fails with one codec, we try the next candidate.
  // This handles the common case where the recording codec (e.g. vp9+opus) differs
  // from what isTypeSupported() picks for playback (e.g. vp9 without audio codec).
  useEffect(() => {
    if (!chunkData || chunkData.totalChunks === 0) return
    const video = videoRef.current
    if (!video) return

    let aborted = false

    if (!("MediaSource" in window)) {
      setError("Your browser does not support MediaSource Extensions (MSE). Please use Chrome, Edge, or Firefox.")
      return
    }

    // If the backend stored the original recording mimeType, try that first
    const storedMime = chunkData.mimeType
    const codecPriority = storedMime
      ? [storedMime, ...PLAYBACK_CODECS.filter(c => c !== storedMime)]
      : PLAYBACK_CODECS
    const supportedCodecs = codecPriority.filter(c => MediaSource.isTypeSupported(c))

    if (supportedCodecs.length === 0) {
      setError("No supported WebM codec found for MSE playback.")
      return
    }

    function waitForUpdateEnd(sb: SourceBuffer): Promise<void> {
      if (!sb.updating) return Promise.resolve()
      return new Promise(resolve => {
        const onEnd = () => { sb.removeEventListener("updateend", onEnd); resolve() }
        sb.addEventListener("updateend", onEnd)
      })
    }

    function appendChunk(sb: SourceBuffer, buf: ArrayBuffer): Promise<boolean> {
      return new Promise(resolve => {
        const onUpdateEnd = () => {
          sb.removeEventListener("updateend", onUpdateEnd)
          sb.removeEventListener("error", onSourceError)
          resolve(true)
        }
        const onSourceError = () => {
          sb.removeEventListener("updateend", onUpdateEnd)
          sb.removeEventListener("error", onSourceError)
          resolve(false)
        }
        sb.addEventListener("updateend", onUpdateEnd)
        sb.addEventListener("error", onSourceError)
        try {
          sb.appendBuffer(buf)
        } catch {
          sb.removeEventListener("updateend", onUpdateEnd)
          sb.removeEventListener("error", onSourceError)
          resolve(false)
        }
      })
    }

    function tryWithCodec(codec: string): Promise<boolean> {
      if (aborted) return Promise.resolve(false)
      return new Promise(resolve => {
        const ms = new MediaSource()
        mediaSourceRef.current = ms
        appendedChunksRef.current = 0
        allBufferedRef.current = false

        const objectUrl = URL.createObjectURL(ms)
        video.src = objectUrl

        ms.addEventListener("sourceopen", async () => {
          try {
            if (aborted || ms.readyState !== "open") { resolve(false); return }
            URL.revokeObjectURL(objectUrl)

            let sb: SourceBuffer
            try {
              sb = ms.addSourceBuffer(codec)
              sourceBufferRef.current = sb
              sb.mode = "sequence"
            } catch { resolve(false); return }

            // Validate codec by appending chunk 0 (the EBML initialization segment).
            // A SourceBuffer error here means codec mismatch — try the next one.
            let res0: Response | null = null
            try { res0 = await fetch(getChunkUrl(chunkData.chunks[0].filename)) } catch {}
            if (!res0 || !res0.ok || aborted) { resolve(false); return }

            let buf0: ArrayBuffer | null = null
            try { buf0 = await res0.arrayBuffer() } catch {}
            if (!buf0 || aborted) { resolve(false); return }

            await waitForUpdateEnd(sb)
            if (aborted) { resolve(false); return }

            const initOk = await appendChunk(sb, buf0)
            if (!initOk) {
              // Codec mismatch — signal decode error and let caller try next codec
              if (ms.readyState === "open") try { ms.endOfStream("decode") } catch {}
              resolve(false)
              return
            }

            appendedChunksRef.current = 1
            setLoadingProgress(Math.round((1 / chunkData.chunks.length) * 100))

            // Codec confirmed — feed remaining chunks
            for (let i = 1; i < chunkData.chunks.length; i++) {
              if (aborted || ms.readyState !== "open") break

              let res: Response | null = null
              try { res = await fetch(getChunkUrl(chunkData.chunks[i].filename)) } catch {}
              if (!res || !res.ok || aborted || ms.readyState !== "open") continue

              let buf: ArrayBuffer | null = null
              try { buf = await res.arrayBuffer() } catch {}
              if (!buf) continue

              await waitForUpdateEnd(sb)
              if (aborted || ms.readyState !== "open") break

              await appendChunk(sb, buf) // non-init chunk errors are non-fatal
              appendedChunksRef.current = i + 1
              setLoadingProgress(Math.round(((i + 1) / chunkData.chunks.length) * 100))
            }

            if (aborted) { resolve(true); return }

            allBufferedRef.current = true
            if (ms.readyState === "open") try { ms.endOfStream() } catch {}

            if (video.duration && isFinite(video.duration)) {
              setTotalDuration(video.duration)
            } else {
              const onDuration = () => {
                if (video.duration && isFinite(video.duration)) setTotalDuration(video.duration)
                video.removeEventListener("durationchange", onDuration)
              }
              video.addEventListener("durationchange", onDuration)
            }

            resolve(true)
          } catch (err: unknown) {
            if (!aborted) console.error("[MSE] Unexpected error with codec", codec, err)
            resolve(false)
          }
        }, { once: true })
      })
    }

    async function tryAllCodecs() {
      for (const codec of supportedCodecs) {
        if (aborted) return
        const success = await tryWithCodec(codec)
        if (success) return
        // Clean up before trying next codec
        if (!aborted) {
          video.src = ""
          mediaSourceRef.current = null
          sourceBufferRef.current = null
        }
      }
      if (!aborted) {
        setError("Could not play video: no compatible codec found. The recording may be in an unsupported format.")
      }
    }

    tryAllCodecs()

    return () => {
      aborted = true
      mediaSourceRef.current = null
      sourceBufferRef.current = null
      if (video) video.src = ""
    }
  }, [chunkData, getChunkUrl])

  // Update currentTime from video element
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setTotalDuration(video.duration)
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("durationchange", handleDurationChange)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("durationchange", handleDurationChange)
    }
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  // ── Controls ──

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleVolumeChange = (values: number[]) => {
    const video = videoRef.current
    if (!video) return
    const vol = values[0] / 100
    video.volume = vol
    setVolume(vol)
    if (vol === 0) {
      video.muted = true
      setIsMuted(true)
    } else if (video.muted) {
      video.muted = false
      setIsMuted(false)
    }
  }

  const seekToGlobalTime = (values: number[]) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = values[0]
    setCurrentTime(values[0])
  }

  const skipForward = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(video.currentTime + 10, totalDuration)
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(video.currentTime - 10, 0)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await containerRef.current.requestFullscreen()
    }
  }

  // ── Format helpers ──

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
  }

  // ── Render ──

  if (loading) {
    return (
      <div className={`flex items-center justify-center aspect-video bg-black rounded-lg ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !chunkData || chunkData.totalChunks === 0) {
    return (
      <div className={`flex flex-col items-center justify-center aspect-video bg-black rounded-lg text-white gap-3 ${className}`}>
        <AlertCircle className="h-10 w-10 opacity-60" />
        <p className="text-sm opacity-80">{error || "No video chunks available"}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setError(null)
            setLoading(true)
            fetch(`/api/video-chunks/${attemptId}?token=${encodeURIComponent(tokenRef.current)}`)
              .then((r) => r.json())
              .then((json) => {
                const data = json.data || json
                setChunkData(data)
              })
              .catch((e) => setError(e?.message || "Retry failed"))
              .finally(() => setLoading(false))
          }}
        >
          <RotateCcw className="h-3.5 w-3.5 me-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${isFullscreen ? "rounded-none" : ""} ${className}`}
    >
      {/* Video element */}
      <div className="aspect-video" onClick={togglePlay}>
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted={isMuted}
        />
      </div>

      {/* Loading overlay while chunks are being buffered */}
      {!allBufferedRef.current && loadingProgress > 0 && loadingProgress < 100 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-2 pointer-events-none">
          <LoadingSpinner size="lg" />
          <p className="text-sm">Buffering chunks... {loadingProgress}%</p>
        </div>
      )}

      {/* Controls overlay – shows on hover or when paused */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
           style={{ opacity: !isPlaying ? 1 : undefined }}>
        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={totalDuration || 1}
            step={0.5}
            onValueChange={seekToGlobalTime}
            className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1 text-white">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="p-1.5 hover:bg-white/20 rounded transition-colors">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          {/* Skip -10s / +10s */}
          <button onClick={skipBackward} className="p-1.5 hover:bg-white/20 rounded transition-colors" title="Back 10s">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={skipForward} className="p-1.5 hover:bg-white/20 rounded transition-colors" title="Forward 10s">
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Volume */}
          <button onClick={toggleMute} className="p-1.5 hover:bg-white/20 rounded transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="cursor-pointer [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
            />
          </div>

          {/* Time display */}
          <span className="text-xs tabular-nums ms-2 select-none">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          {/* Chunk progress indicator */}
          <span className="text-xs tabular-nums ms-1.5 px-1.5 py-0.5 rounded bg-white/15 select-none">
            {appendedChunksRef.current}/{chunkData.totalChunks}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/20 rounded transition-colors" title="Toggle fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
