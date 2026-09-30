import type { PublicBrandingDto } from "./api/organization"

// The supplied E-Source assets are bundled locally; branding never requires its server at runtime.
export const BRAND_ASSETS = {
  government: "/branding/government-of-dubai-white.svg",
  digitalDubai: "/branding/digital-dubai.png",
  favicon: "/branding/favicon.png",
  background: "/branding/background-topic.jpg",
  uaePassButton: "/branding/uaepass-signin-button.svg",
  uaePassLogo: "/branding/uaepass-logo.svg",
} as const

export const DEFAULT_BRANDING: PublicBrandingDto = {
  name: "Digital Dubai Exams",
  logoUrl: BRAND_ASSETS.digitalDubai,
  faviconUrl: BRAND_ASSETS.favicon,
  footerText: "Digital Dubai · Dubai Data and Statistics Establishment",
  supportEmail: "", supportUrl: "", mobileNumber: "", officeNumber: "",
  primaryColor: "#0076a8",
  isActive: false,
}

export function brandingAssetUrl(value: string | null | undefined, fallback = ""): string {
  if (!value) return fallback
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      return url.username || url.password ? fallback : url.href
    } catch { return fallback }
  }
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return fallback
  if (value.startsWith("/branding/")) return value
  return `/api/backend-files${value}`
}

export function normalizeBranding(data: Partial<PublicBrandingDto> | null): PublicBrandingDto {
  const result = { ...DEFAULT_BRANDING, ...data }
  for (const key of ["name", "logoUrl", "faviconUrl", "footerText"] as const) {
    if (!result[key]?.trim()) result[key] = DEFAULT_BRANDING[key]
  }
  if (!/^#[a-f\d]{6}$/i.test(result.primaryColor ?? "")) result.primaryColor = DEFAULT_BRANDING.primaryColor
  return result
}

export function hexToHsl(hex: string): string {
  const color = /^#[a-f\d]{6}$/i.test(hex) ? hex : DEFAULT_BRANDING.primaryColor
  const [r, g, b] = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const delta = max - min, lightness = (max + min) / 2
  let hue = 0
  if (delta) {
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
  }
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0
  return `${Math.round(hue * 60)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

/** WCAG relative luminance: choose the higher-contrast black/white label (at least 4.5:1). */
export function contrastForeground(hex: string): string {
  const color = /^#[a-f\d]{6}$/i.test(hex) ? hex : DEFAULT_BRANDING.primaryColor
  const channels = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "0 0% 0%" : "0 0% 100%"
}
