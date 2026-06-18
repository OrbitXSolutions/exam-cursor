import { type NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5221/api";
const BACKEND_BASE_URL = BACKEND_API_URL.replace(/\/api\/?$/, "");

/**
 * Proxy for backend static files (organization logos, favicons, videos, etc.)
 * Maps /api/backend-files/tutorials/video.mp4 → BACKEND/tutorials/video.mp4
 *
 * Streams the response directly (no buffering) and forwards Range headers so
 * the browser can seek and progressively load videos without downloading the
 * entire file first.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const url = `${BACKEND_BASE_URL}/${path.join("/")}`;

  // Forward Range header so browsers can seek within video files
  const upstreamHeaders: Record<string, string> = {};
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    upstreamHeaders["Range"] = rangeHeader;
  }

  try {
    const response = await fetch(url, { headers: upstreamHeaders });

    // Allow 206 Partial Content (range responses) in addition to 200
    if (!response.ok && response.status !== 206) {
      return new NextResponse(null, { status: response.status });
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type":
        response.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    };

    // Forward headers required for video streaming and seeking
    const forward = [
      "content-range",
      "accept-ranges",
      "content-length",
      "last-modified",
      "etag",
    ];
    for (const header of forward) {
      const value = response.headers.get(header);
      if (value) responseHeaders[header] = value;
    }

    // Stream the body directly — never buffer large files into memory
    return new NextResponse(response.body, {
      status: response.status, // preserves 206 for partial content
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[Backend Files Proxy Error] ${url}`, error);
    return new NextResponse(null, { status: 502 });
  }
}
