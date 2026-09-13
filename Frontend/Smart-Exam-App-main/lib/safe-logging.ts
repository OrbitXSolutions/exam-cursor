export function getSafePath(url: string): string {
  try {
    const path = new URL(url, "http://frontend.invalid").pathname;
    // Share links contain a credential in the path, not just in the query.
    return path.replace(
      /(\/(?:share(?:d)?(?:-link)?|public\/exam)\/)[^/]+/gi,
      "$1[redacted]",
    );
  } catch {
    return "[invalid-path]";
  }
}

export function getCorrelationId(headers?: Headers): string | undefined {
  const value = headers?.get("X-Trace-Id");
  return value && /^[a-zA-Z0-9._:-]{1,128}$/.test(value) ? value : undefined;
}

export function logRequest(
  scope: "API" | "API Upload" | "Auth" | "Proxy",
  method: string,
  url: string,
  startedAt: number,
  status?: number,
  correlationId?: string,
  failed = false,
): void {
  const metadata = {
    method,
    path: getSafePath(url),
    status: status ?? null,
    durationMs: Math.max(0, Date.now() - startedAt),
    ...(correlationId && { correlationId }),
  };
  if (failed || (status !== undefined && status >= 400)) {
    console.warn(`[${scope}] Request failed`, metadata);
  } else if (process.env.NODE_ENV !== "production") {
    console.info(`[${scope}] Request completed`, metadata);
  }
}

// SignalR's built-in logger can include transport URLs containing access_token.
// Keep only warning/error severity; never forward its message argument.
export const safeSignalRLogger = {
  log(level: number): void {
    if (level >= 3 && level <= 5) {
      console.warn("[SignalR] Transport diagnostic", { level });
    }
  },
};
