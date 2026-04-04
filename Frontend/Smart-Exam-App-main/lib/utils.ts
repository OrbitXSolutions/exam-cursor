import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Global application timezone */
export const APP_TIMEZONE = "Asia/Dubai";

/**
 * Format a date string or Date to a locale string in Dubai timezone.
 * Wraps toLocaleString with timeZone: "Asia/Dubai" injected.
 */
export function formatDateDubai(
  date: string | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, { timeZone: APP_TIMEZONE, ...options });
}

/**
 * Format a date string or Date to a locale date string in Dubai timezone.
 */
export function formatDateOnlyDubai(
  date: string | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, { timeZone: APP_TIMEZONE, ...options });
}

/**
 * Format a date string or Date to a locale time string in Dubai timezone.
 */
export function formatTimeOnlyDubai(
  date: string | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale, { timeZone: APP_TIMEZONE, ...options });
}
