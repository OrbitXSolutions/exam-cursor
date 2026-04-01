"use client"

import { useState, useEffect, useCallback } from "react"
import { ZoomIn, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface ImageZoomModalProps {
  src: string
  alt: string
  className?: string
  thumbnailClassName?: string
}

export function ImageZoomModal({ src, alt, className, thumbnailClassName }: ImageZoomModalProps) {
  const [open, setOpen] = useState(false)
  const { dir } = useI18n()

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleKeyDown])

  return (
    <>
      {/* Thumbnail with zoom indicator */}
      <div
        className={`group relative cursor-zoom-in ${className ?? ""}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
      >
        <img
          src={src}
          alt={alt}
          className={thumbnailClassName ?? "max-h-40 w-auto object-contain"}
        />
        {/* Zoom icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10 rounded-md">
          <div className="rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* True fullscreen overlay — no Dialog constraints */}
      {open && (
        <div
          dir={dir}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute end-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Full-size image — scales UP to fill available space */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "92vh", maxWidth: "94vw", width: "auto", height: "auto", minWidth: "60vw", minHeight: "50vh", objectFit: "contain" }}
            className="select-none"
          />
        </div>
      )}
    </>
  )
}
