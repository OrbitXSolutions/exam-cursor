/**
 * Fetches and caches proctoring video configuration from the backend.
 * Includes: STUN servers, feature flags (EnableLiveVideo, EnableVideoRecording).
 */

export interface VideoConfig {
  enableLiveVideo: boolean;
  enableVideoRecording: boolean;
  enableSmartMonitoring: boolean;
  stunServers: string[];
}

const DEFAULT_CONFIG: VideoConfig = {
  enableLiveVideo: false,
  enableVideoRecording: false,
  enableSmartMonitoring: false,
  stunServers: [],
};

let cachedConfig: VideoConfig | null = null;
let fetchPromise: Promise<VideoConfig> | null = null;

/**
 * Fetch video config from backend. Cached per session.
 * Returns safe defaults (all disabled) if fetch fails.
 */
export async function getVideoConfig(): Promise<VideoConfig> {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const res = await fetch("/api/proxy/Proctor/video-config", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.warn("[VideoConfig] Fetch failed, using defaults (disabled)");
        cachedConfig = DEFAULT_CONFIG;
        return DEFAULT_CONFIG;
      }
      const json = await res.json();
      const data = json?.data ?? json;
      cachedConfig = {
        enableLiveVideo: data?.enableLiveVideo ?? false,
        enableVideoRecording: data?.enableVideoRecording ?? false,
        enableSmartMonitoring: data?.enableSmartMonitoring ?? false,
        stunServers: Array.isArray(data?.stunServers) ? data.stunServers : [],
      };
      console.log(
        `%c[VideoConfig] ✅ Fetched config: enableLiveVideo=${cachedConfig.enableLiveVideo}, enableVideoRecording=${cachedConfig.enableVideoRecording}, stunServers=${JSON.stringify(cachedConfig.stunServers)}`,
        "color: #2196f3; font-weight: bold",
      );
      return cachedConfig;
    } catch (e) {
      console.warn("[VideoConfig] Fetch error, using defaults (disabled):", e);
      cachedConfig = DEFAULT_CONFIG;
      return DEFAULT_CONFIG;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Build RTCConfiguration from video config STUN servers.
 * Returns empty iceServers if no STUN configured (LAN-only).
 */
export function buildRtcConfig(config: VideoConfig): RTCConfiguration {
  return {
    iceServers:
      config.stunServers.length > 0
        ? config.stunServers.map((url) => ({ urls: url }))
        : [],
  };
}

/** Reset cached config (e.g. on logout) */
export function clearVideoConfigCache(): void {
  cachedConfig = null;
  fetchPromise = null;
}
