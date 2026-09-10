import { getBackendApiUrl, getBackendBaseUrl } from "@/lib/backend-url.mjs";

const configuredUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5221/api";

export const backendApiUrl = getBackendApiUrl(configuredUrl);
export const backendBaseUrl = getBackendBaseUrl(configuredUrl);
