import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5221/api";

/**
 * Proxy to serve individual video chunk files.
 * GET /api/video-chunks/{attemptId}/{filename}?token=JWT
 *
 * <video> tags cannot send Authorization headers,
 * so we accept ?token=JWT and forward it to the backend.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string; filename: string }> },
) {
  const { attemptId, filename } = await params;

  const tokenFromQuery = request.nextUrl.searchParams.get("token");
  const tokenFromHeader = request.headers.get("authorization");
  const authorization = tokenFromQuery
    ? `Bearer ${tokenFromQuery}`
    : tokenFromHeader;

  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = `${BACKEND_URL}/Proctor/video-chunks/${attemptId}/${filename}`;

  try {
    const requestHeaders: Record<string, string> = {
      Authorization: authorization,
    };

    // Forward Range header for seeking within a chunk
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      requestHeaders["Range"] = rangeHeader;
    }

    const response = await fetch(url, { headers: requestHeaders });

    if (!response.ok) {
      return new NextResponse(response.statusText, { status: response.status });
    }

    const headers: Record<string, string> = {
      "Content-Type": "video/webm",
    };

    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    if (contentLength) headers["Content-Length"] = contentLength;
    if (acceptRanges) headers["Accept-Ranges"] = acceptRanges;
    if (contentRange) headers["Content-Range"] = contentRange;

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error(`[VideoChunk File Proxy Error]`, error);
    return NextResponse.json(
      { error: "Failed to stream video chunk" },
      { status: 500 },
    );
  }
}
