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

export function VideoChunkPlayer({ attemptId, className = "" }: VideoChunkPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const [chunkData, setChunkData] = useState<ChunkListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Progress – expressed as total seconds across all chunks
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)

  const tokenRef = useRef<string>("")

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
        setTotalDuration((data.totalChunks * data.chunkDurationMs) / 1000)
      } catch (err: any) {
        setError(err?.message || "Failed to load video chunks")
      } finally {
        setLoading(false)
      }
    }

    if (attemptId) fetchChunks()
  }, [attemptId])

  // Load a specific chunk into the video element
  const loadChunk = useCallback(
    (index: number, autoPlay = false) => {
      if (!chunkData || index < 0 || index >= chunkData.totalChunks) return
      const video = videoRef.current
      if (!video) return

      const chunk = chunkData.chunks[index]
      video.src = getChunkUrl(chunk.filename)
      video.load()
      setCurrentChunkIndex(index)

      if (autoPlay) {
        video.play().catch(() => {})
      }
    },
    [chunkData, getChunkUrl],
  )

  // Load first chunk once data arrives
  useEffect(() => {
    if (chunkData && chunkData.totalChunks > 0) {
      loadChunk(0, false)
    }
  }, [chunkData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update progress based on video timeupdate
  useEffect(() => {
    const video = videoRef.current
    if (!video || !chunkData) return

    const chunkDurationSec = chunkData.chunkDurationMs / 1000

    const handleTimeUpdate = () => {
      const globalTime = currentChunkIndex * chunkDurationSec + video.currentTime
      setCurrentTime(globalTime)
    }

    const handleEnded = () => {
      // Auto-advance to next chunk
      if (currentChunkIndex < chunkData.totalChunks - 1) {
        loadChunk(currentChunkIndex + 1, true)
      } else {
        // Reached end of all chunks
        setIsPlaying(false)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [chunkData, currentChunkIndex, loadChunk])

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
    if (!chunkData) return
    const targetTime = values[0]
    const chunkDurationSec = chunkData.chunkDurationMs / 1000
    const targetChunk = Math.min(
      Math.floor(targetTime / chunkDurationSec),
      chunkData.totalChunks - 1,
    )
    const withinChunkTime = targetTime - targetChunk * chunkDurationSec

    if (targetChunk === currentChunkIndex) {
      // Same chunk — just seek within
      const video = videoRef.current
      if (video) {
        video.currentTime = withinChunkTime
      }
    } else {
      // Different chunk — load it, then seek
      const video = videoRef.current
      if (!video) return
      const chunk = chunkData.chunks[targetChunk]
      video.src = getChunkUrl(chunk.filename)
      video.load()
      setCurrentChunkIndex(targetChunk)

      const onCanPlay = () => {
        video.currentTime = withinChunkTime
        if (isPlaying) video.play().catch(() => {})
        video.removeEventListener("canplay", onCanPlay)
      }
      video.addEventListener("canplay", onCanPlay)
    }

    setCurrentTime(targetTime)
  }

  const skipNext = () => {
    if (!chunkData || currentChunkIndex >= chunkData.totalChunks - 1) return
    loadChunk(currentChunkIndex + 1, isPlaying)
  }

  const skipPrev = () => {
    if (!chunkData || currentChunkIndex <= 0) return
    loadChunk(currentChunkIndex - 1, isPlaying)
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
            // Re-fetch
            fetch(`/api/video-chunks/${attemptId}?token=${encodeURIComponent(tokenRef.current)}`)
              .then((r) => r.json())
              .then((json) => {
                const data = json.data || json
                setChunkData(data)
                setTotalDuration((data.totalChunks * data.chunkDurationMs) / 1000)
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

          {/* Skip prev/next */}
          <button onClick={skipPrev} className="p-1.5 hover:bg-white/20 rounded transition-colors" title="Previous chunk">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={skipNext} className="p-1.5 hover:bg-white/20 rounded transition-colors" title="Next chunk">
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

          {/* Chunk indicator */}
          <span className="text-xs tabular-nums ms-1.5 px-1.5 py-0.5 rounded bg-white/15 select-none">
            {currentChunkIndex + 1}/{chunkData.totalChunks}
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
