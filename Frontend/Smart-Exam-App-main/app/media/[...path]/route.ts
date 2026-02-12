import { type NextRequest, NextResponse } from "next/server"

const BACKEND_API_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5221/api"
const BACKEND_BASE_URL = BACKEND_API_URL.replace(/\/api\/?$/, "")

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = `${BACKEND_BASE_URL}/media/${path.join("/")}`

  try {
    const response = await fetch(url)
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      status: response.status,
      headers: { "Content-Type": contentType },
    })
  } catch (error) {
    console.error(`[Media Proxy Error] ${url}`, error)
    return new NextResponse(null, { status: 502 })
  }
}
