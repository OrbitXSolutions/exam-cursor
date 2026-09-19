"use client"

import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from "react"

export function evidenceProxyPath(source?: string): string | null {
  if (!source || !/^\/api\/(?:proxy\/)?Proctor\/evidence\/[1-9]\d*\/download$/i.test(source)) return null
  return source.replace(/^\/api\/(?:proxy\/)?/i, "/api/proxy/")
}

// Snapshot URLs are private API resources. Credentials are sent only to the
// application's allowlisted proxy path, never to an arbitrary stored URL.
function useEvidenceImage(src?: string) {
  const [image, setImage] = useState<{ source: string; blobUrl: string } | null>(null)
  useEffect(() => {
    const route = evidenceProxyPath(src)
    if (!route || !src) return
    const controller = new AbortController()
    let blobUrl: string | undefined
    async function load() {
      const token = localStorage.getItem("auth_token")
      if (!token) return
      try {
        const response = await fetch(route!, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
          redirect: "error", signal: controller.signal,
        })
        if (!response.ok || !["image/jpeg", "image/png", "image/webp"].includes(
          response.headers.get("content-type")?.split(";")[0] ?? "",
        )) return
        const blob = await response.blob()
        if (controller.signal.aborted) return
        blobUrl = URL.createObjectURL(blob)
        setImage({ source: src!, blobUrl })
      } catch {
        // A failed authenticated fetch leaves the image unavailable.
      }
    }
    void load()
    return () => { controller.abort(); if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [src])
  return image && image.source === src ? image.blobUrl : undefined
}

export function EvidenceImage({ src, alt, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string }) {
  const blobUrl = useEvidenceImage(src)
  return <img {...props} src={blobUrl} alt={alt} />
}

export function EvidenceLink({ src, children, className }: { src: string; children: ReactNode; className?: string }) {
  const blobUrl = useEvidenceImage(src)
  return <a href={blobUrl} target="_blank" rel="noopener noreferrer" className={className}
    aria-disabled={!blobUrl} onClick={(event) => { if (!blobUrl) event.preventDefault() }}>{children}</a>
}
