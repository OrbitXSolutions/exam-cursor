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
}

interface VideoChunkPlayerProps {
  attemptId: number
  className?: string
}

/**
 * MSE-based video chunk player.
 *
 * Uses MediaSource Extensions to stitch WebM chunks together in the browser.
 * Chunk 0 contains the WebM EBML header + initialization segment; subsequent
 * chunks contain only Cluster data. MSE handles this seamlessly by appending
 * each chunk's ArrayBuffer into a single SourceBuffer.
 */
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

  // Set up MSE and append all chunks once chunkData arrives
  useEffect(() => {
    if (!chunkData || chunkData.totalChunks === 0) return
    const video = videoRef.current
    if (!video) return

    // Check MSE support
    if (!("MediaSource" in window)) {
      setError("Your browser does not support MediaSource Extensions (MSE). Please use Chrome, Edge, or Firefox.")
      return
    }

    // Find supported MSE codec
    const codecs = [
      'video/webm; codecs="vp9"',
      'video/webm; codecs="vp8"',
      'video/webm; codecs="vp8, vorbis"',
      'video/webm; codecs="vp9, opus"',
      'video/webm',
    ]
    let mimeCodec = ""
    for (const c of codecs) {
      if (MediaSource.isTypeSupported(c)) {
        mimeCodec = c
        break
      }
    }
    if (!mimeCodec) {
      setError("No supported WebM codec found for MSE playback.")
      return
    }

    const mediaSource = new MediaSource()
    mediaSourceRef.current = mediaSource
    appendedChunksRef.current = 0
    allBufferedRef.current = false

    const objectUrl = URL.createObjectURL(mediaSource)
    video.src = objectUrl

    mediaSource.addEventListener("sourceopen", async () => {
      try {
        // Revoke object URL early — source is already attached
        URL.revokeObjectURL(objectUrl)

        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
        sourceBufferRef.current = sourceBuffer
        sourceBuffer.mode = "sequence" // Append in order, browser calculates timestamps

        // Fetch and append all chunks sequentially
        for (let i = 0; i < chunkData.chunks.length; i++) {
          const chunk = chunkData.chunks[i]
          const url = getChunkUrl(chunk.filename)

          const response = await fetch(url)
          if (!response.ok) {
            console.warn(`[MSE] Failed to fetch chunk ${i}: ${response.status}`)
            continue
          }

          const arrayBuffer = await response.arrayBuffer()

          // Wait for sourceBuffer to be ready
          await new Promise<void>((resolve, reject) => {
            if (!sourceBuffer.updating) {
              resolve()
              return
            }
            const onUpdateEnd = () => {
              sourceBuffer.removeEventListener("updateend", onUpdateEnd)
              sourceBuffer.removeEventListener("error", onError)
              resolve()
            }
            const onError = () => {
              sourceBuffer.removeEventListener("updateend", onUpdateEnd)
              sourceBuffer.removeEventListener("error", onError)
              reject(new Error(`SourceBuffer error before chunk ${i}`))
            }
            sourceBuffer.addEventListener("updateend", onUpdateEnd)
            sourceBuffer.addEventListener("error", onError)
          })

          // Append the buffer
          sourceBuffer.appendBuffer(arrayBuffer)

          // Wait for append to complete
          await new Promise<void>((resolve, reject) => {
            const onUpdateEnd = () => {
              sourceBuffer.removeEventListener("updateend", onUpdateEnd)
              sourceBuffer.removeEventListener("error", onError)
              resolve()
            }
            const onError = () => {
              sourceBuffer.removeEventListener("updateend", onUpdateEnd)
              sourceBuffer.removeEventListener("error", onError)
              reject(new Error(`SourceBuffer error appending chunk ${i}`))
            }
            sourceBuffer.addEventListener("updateend", onUpdateEnd)
            sourceBuffer.addEventListener("error", onError)
          })

          appendedChunksRef.current = i + 1
          setLoadingProgress(Math.round(((i + 1) / chunkData.chunks.length) * 100))
        }

        // All chunks appended — signal end of stream
        allBufferedRef.current = true
        if (mediaSource.readyState === "open") {
          mediaSource.endOfStream()
        }

        // Use the actual buffered duration from the browser
        if (video.duration && isFinite(video.duration)) {
          setTotalDuration(video.duration)
        } else {
          // Wait for durationchange
          const onDuration = () => {
            if (video.duration && isFinite(video.duration)) {
              setTotalDuration(video.duration)
            }
            video.removeEventListener("durationchange", onDuration)
          }
          video.addEventListener("durationchange", onDuration)
        }
      } catch (err: any) {
        console.error("[MSE] Error during chunk loading:", err)
        setError(err?.message || "Error loading video chunks via MSE")
      }
    })

    return () => {
      // Cleanup
      mediaSourceRef.current = null
      sourceBufferRef.current = null
      if (video) {
        video.src = ""
      }
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
