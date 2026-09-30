"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { getPublicBranding } from "@/lib/api/organization"
import { BRAND_ASSETS, DEFAULT_BRANDING, brandingAssetUrl, contrastForeground, hexToHsl, normalizeBranding } from "@/lib/branding"

const BrandingContext = createContext({ branding: DEFAULT_BRANDING, loading: true })
const BRANDING_CHANGED = "organization-branding-changed"

/** One shared subscription applies the existing organization/system settings to every role and route. */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ branding: DEFAULT_BRANDING, loading: true })
  const pathname = usePathname()

  useEffect(() => {
    let request = 0
    let mounted = true
    async function refresh() {
      const current = ++request
      const branding = await getPublicBranding().then(normalizeBranding).catch(() => DEFAULT_BRANDING)
      if (mounted && current === request) {
        // Uploads replace the same filename. Bust the proxy/browser asset cache after a refresh.
        const version = Date.now()
        const versioned = { ...branding }
        for (const key of ["logoUrl", "faviconUrl"] as const) {
          if (versioned[key].startsWith("/organization/")) versioned[key] += `?v=${version}`
        }
        setState({ branding: versioned, loading: false })
      }
    }
    void refresh()
    window.addEventListener(BRANDING_CHANGED, refresh)
    return () => { mounted = false; window.removeEventListener(BRANDING_CHANGED, refresh) }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const color = hexToHsl(state.branding.primaryColor)
    const foreground = contrastForeground(state.branding.primaryColor)
    for (const key of ["primary", "ring", "sidebar-primary", "sidebar-ring", "chart-1"])
      root.style.setProperty(`--${key}`, color)
    for (const key of ["primary-foreground", "sidebar-primary-foreground"])
      root.style.setProperty(`--${key}`, foreground)
    // The official defaults have separate accessible light/dark tokens in globals.css.
    if (state.branding.primaryColor.toLowerCase() === DEFAULT_BRANDING.primaryColor) {
      for (const key of ["primary", "primary-foreground", "ring", "sidebar-primary", "sidebar-primary-foreground", "sidebar-ring", "chart-1"])
        root.style.removeProperty(`--${key}`)
    }
    const favicon = brandingAssetUrl(state.branding.faviconUrl, BRAND_ASSETS.favicon)
    // A broken custom favicon must also fall back to the bundled D mark.
    const applyIcon = (url: string) => document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => {
        link.href = url
        link.removeAttribute("type")
        link.removeAttribute("sizes")
      })
    const preview = new Image()
    preview.onload = () => applyIcon(favicon)
    preview.onerror = () => applyIcon(BRAND_ASSETS.favicon)
    preview.src = favicon
    return () => { preview.onload = null; preview.onerror = null }
  }, [state.branding, pathname])

  return <BrandingContext.Provider value={state}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  const { branding, loading } = useContext(BrandingContext)
  return {
    branding, loading, hasOrgBranding: branding.isActive,
    logoSrc: brandingAssetUrl(branding.logoUrl, BRAND_ASSETS.digitalDubai),
    orgName: branding.name, DEFAULT_BRANDING,
  }
}

/** Refresh the existing public branding after an organization or system settings save. */
export function invalidateBrandingCache() {
  window.dispatchEvent(new Event(BRANDING_CHANGED))
}
