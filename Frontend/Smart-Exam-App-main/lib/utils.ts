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

/**
 * Convert an ISO datetime string from the API (with +04:00 offset) to
 * "YYYY-MM-DDTHH:mm" suitable for datetime-local input in UAE time.
 */
export function utcToUaeInput(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  // Shift to UAE (+4h) then format as "YYYY-MM-DDTHH:mm"
  const uae = new Date(d.getTime() + 4 * 60 * 60 * 1000);
  return uae.toISOString().slice(0, 16);
}

/**
 * Convert "YYYY-MM-DDTHH:mm" from a datetime-local input (UAE time)
 * to an ISO string with +04:00 offset, ready to send to the API.
 */
export function uaeInputToIso(localStr: string | null | undefined): string {
  if (!localStr) return "";
  return `${localStr}:00+04:00`;
}
