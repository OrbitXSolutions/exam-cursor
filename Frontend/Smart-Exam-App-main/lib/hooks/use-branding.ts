"use client";

import { useState, useEffect } from "react";
import {
  getPublicBranding,
  type PublicBrandingDto,
} from "@/lib/api/organization";

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

/** Invalidate cached branding (call after admin updates org settings) */
export function invalidateBrandingCache() {
  cachedBranding = null;
  fetchPromise = null;
}
