"use client";

import { useState, useEffect } from "react";
import {
  getPublicBranding,
  type PublicBrandingDto,
} from "@/lib/api/organization";

// ─── Hex → HSL conversion ────────────────────────────────────────────
function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Determines a readable foreground color (white or black) based on
 * the perceived luminance of a hex background color.
 */
function contrastForeground(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 100%"; // default white
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  // Perceived luminance (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "0 0% 0%" : "0 0% 100%";
}

const DEFAULT_BRANDING: PublicBrandingDto = {
  name: "SmartExam",
  logoUrl: "",
  faviconUrl: "",
  footerText: "",
  supportEmail: "",
  supportUrl: "",
  mobileNumber: "",
  officeNumber: "",
  primaryColor: "#0d9488",
  isActive: false,
};

// Simple in-memory cache so we don't refetch on every mount
let cachedBranding: PublicBrandingDto | null = null;
let fetchPromise: Promise<PublicBrandingDto> | null = null;

function fetchBranding(): Promise<PublicBrandingDto> {
  if (cachedBranding) return Promise.resolve(cachedBranding);
  if (fetchPromise) return fetchPromise;

  fetchPromise = getPublicBranding()
    .then((data) => {
      cachedBranding = data;
      fetchPromise = null;
      return data;
    })
    .catch(() => {
      fetchPromise = null;
      return DEFAULT_BRANDING;
    });

  return fetchPromise;
}

/**
 * Hook to get organization branding.
 * Returns default SmartExam branding while loading or if org is not set up.
 */
export function useBranding() {
  const [branding, setBranding] = useState<PublicBrandingDto>(
    cachedBranding ?? DEFAULT_BRANDING,
  );
  const [loading, setLoading] = useState(!cachedBranding);

  useEffect(() => {
    let cancelled = false;
    fetchBranding().then((data) => {
      if (!cancelled) {
        setBranding(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Determine if org branding is actually configured (has a name that isn't empty/default)
  const hasOrgBranding =
    branding.isActive && branding.name !== "" && branding.name !== "SmartExam";

  // Build the logo URL — org logos are served as static files from backend at /organization/logo.png
  const logoSrc = branding.logoUrl
    ? branding.logoUrl.startsWith("http")
      ? branding.logoUrl
      : `http://localhost:5221${branding.logoUrl}`
    : "";

  return {
    branding,
    loading,
    hasOrgBranding,
    logoSrc,
    orgName: hasOrgBranding ? branding.name : "SmartExam",
    DEFAULT_BRANDING,
  };
}

/**
 * Hook that applies the organization's primaryColor to the CSS --primary variable.
 * Call this in candidate-facing layouts / pages so the org color is used everywhere.
 * @param enabled - Whether to apply the color (default: true). Pass false to skip (e.g. for admin users).
 */
export function useApplyBrandingColor(enabled: boolean = true) {
  const { branding, hasOrgBranding } = useBranding();

  useEffect(() => {
    if (!enabled || !hasOrgBranding || !branding.primaryColor) return;

    const hsl = hexToHSL(branding.primaryColor);
    if (!hsl) return;

    const root = document.documentElement;
    const fg = contrastForeground(branding.primaryColor);

    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--primary-foreground", fg);

    return () => {
      // Reset when unmounted (e.g. navigating away from candidate pages)
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
    };
  }, [branding.primaryColor, hasOrgBranding, enabled]);
}

/** Invalidate cached branding (call after admin updates org settings) */
export function invalidateBrandingCache() {
  cachedBranding = null;
  fetchPromise = null;
}
