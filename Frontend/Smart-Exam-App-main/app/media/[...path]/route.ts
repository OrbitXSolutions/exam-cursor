import { type NextRequest, NextResponse } from "next/server"
import { backendBaseUrl as BACKEND_BASE_URL } from "@/lib/server/backend-config"

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
  } catch {
    console.error("[Media Proxy] Request failed")
    return new NextResponse(null, { status: 502 })
  }
}
