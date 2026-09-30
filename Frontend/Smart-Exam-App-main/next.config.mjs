import { getBackendBaseUrl } from "./lib/backend-url.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Next's development access log includes the raw query string. The SSO gateway
  // emits safe metadata itself; never print callback authorization codes here.
  logging: {
    incomingRequests: { ignore: [/^\/api\/sso\//] },
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5221"
    const origin = getBackendBaseUrl(backend)
    return [
      {
        source: "/media/:path*",
        destination: `${origin}/media/:path*`,
      },
      {
        source: "/candidateIDs/:path*",
        destination: `${origin}/candidateIDs/:path*`,
      },
    ]
  },
}

export default nextConfig
