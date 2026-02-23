import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5221/api";

/**
 * Proxy for video chunk list.
 * GET /api/video-chunks/{attemptId}?token=JWT
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const { attemptId } = await params;

  const tokenFromQuery = request.nextUrl.searchParams.get("token");
  const tokenFromHeader = request.headers.get("authorization");
  const authorization = tokenFromQuery
    ? `Bearer ${tokenFromQuery}`
    : tokenFromHeader;

  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = `${BACKEND_URL}/Proctor/video-chunks/${attemptId}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: authorization },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[VideoChunks Proxy Error]`, error);
    return NextResponse.json(
      { error: "Failed to fetch video chunks" },
      { status: 500 },
    );
  }
}
