import { getBackendBaseUrl } from "./lib/backend-url.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
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
