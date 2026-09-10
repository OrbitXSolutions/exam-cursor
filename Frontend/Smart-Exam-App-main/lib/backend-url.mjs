/**
 * Normalize either the backend origin or the legacy API-base form.
 * Preserve an optional reverse-proxy path prefix, but never URL credentials.
 * @param {string} value
 */
export function getBackendBaseUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Backend URL must be an absolute HTTP(S) URL");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new Error("Backend URL must use HTTP(S) without credentials, query or fragment");
  }
  const path = url.pathname.replace(/\/+$/, "").replace(/\/api$/i, "");
  return `${url.origin}${path}`;
}

/** @param {string} value */
export function getBackendApiUrl(value) {
  return `${getBackendBaseUrl(value)}/api`;
}
