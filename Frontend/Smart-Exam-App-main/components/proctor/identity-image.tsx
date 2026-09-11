"use client"

import { useEffect, useState } from "react"

export function IdentityImage({ url, alt, unavailable }: {
  url: string
  alt: string
  unavailable: string
}) {
  const [image, setImage] = useState<{ source: string; blobUrl: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let blobUrl: string | undefined

    async function load() {
      // Never send the session credential to a URL supplied by a stored document path.
      if (!/^\/api\/proctor\/authentication\/verifications\/[1-9]\d*\/images\/(document|selfie)$/.test(url))
        return
      const token = localStorage.getItem("auth_token")
      if (!token) return
      try {
        const response = await fetch(`/api/proxy${url.slice(4)}`, {
          headers: { Authorization: "Bearer " + token },
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        })
        if (!response.ok || !["image/jpeg", "image/png", "image/webp"].includes(
          response.headers.get("content-type")?.split(";")[0] ?? "",
        )) return
        const blob = await response.blob()
        if (controller.signal.aborted) return
        blobUrl = URL.createObjectURL(blob)
        setImage({ source: url, blobUrl })
      } catch {
        // Authentication/network failures leave the private document unavailable.
      }
    }
    void load()
    return () => {
      controller.abort()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [url])

  return image?.source === url ? (
    <img src={image.blobUrl} alt={alt} className="w-full h-auto max-h-48 object-contain" />
  ) : (
    <div className="flex items-center justify-center h-48">
      <span className="text-muted-foreground text-sm">{unavailable}</span>
    </div>
  )
}
