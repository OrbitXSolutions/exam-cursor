import { type NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5221/api"
const BACKEND_BASE_URL = BACKEND_API_URL.replace(/\/api\/?$/, "")

/**
 * Proxy for backend static files (organization logos, favicons, etc.)
 * Maps /api/backend-files/organization/logo.png → BACKEND/organization/logo.png
 * This avoids hardcoding localhost:5221 in client-side code.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = `${BACKEND_BASE_URL}/${path.join("/")}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return new NextResponse(null, { status: response.status })
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream"
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    })
  } catch (error) {
    console.error(`[Backend Files Proxy Error] ${url}`, error)
    return new NextResponse(null, { status: 502 })
  }
}
