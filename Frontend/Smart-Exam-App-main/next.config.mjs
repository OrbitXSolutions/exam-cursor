/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5221"
    // Strip trailing /api if present so we get the root origin
    const origin = backend.replace(/\/api\/?$/, "")
    return [
      {
        source: "/media/:path*",
        destination: `${origin}/media/:path*`,
      },
    ]
  },
}

export default nextConfig
