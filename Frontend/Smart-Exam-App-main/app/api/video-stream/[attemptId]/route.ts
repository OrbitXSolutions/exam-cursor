import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5221/api";

/**
 * Dedicated video-stream proxy that supports token via query param.
 * <video src="..."> tags cannot send Authorization headers,
 * so we accept ?token=JWT and forward it to the backend.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params;

  // Accept token from query param (for <video> tags) or Authorization header
  const tokenFromQuery = request.nextUrl.searchParams.get("token");
  const tokenFromHeader = request.headers.get("authorization");
  const authorization = tokenFromQuery
    ? `Bearer ${tokenFromQuery}`
    : tokenFromHeader;

  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = `${BACKEND_URL}/Proctor/video-stream/${attemptId}`;

  try {
    const requestHeaders: Record<string, string> = {
      Authorization: authorization,
    };

    // Forward Range header for video seeking
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      requestHeaders["Range"] = rangeHeader;
    }

    const response = await fetch(url, {
      headers: requestHeaders,
    });

    if (!response.ok) {
      return new NextResponse(response.statusText, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");

    // Stream the video response body through
    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };
    if (contentLength) headers["Content-Length"] = contentLength;
    if (acceptRanges) headers["Accept-Ranges"] = acceptRanges;

    // Forward range response headers for seeking support
    const contentRange = response.headers.get("content-range");
    if (contentRange) headers["Content-Range"] = contentRange;

    // Forward the Range header from the browser for seeking
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error(`[VideoStream Proxy Error]`, error);
    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 },
    );
  }
}
