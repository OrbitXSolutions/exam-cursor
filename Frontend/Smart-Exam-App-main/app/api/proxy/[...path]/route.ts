import { type NextRequest, NextResponse } from "next/server";
import { backendApiUrl as BACKEND_URL } from "@/lib/server/backend-config";
import { getCorrelationId, logRequest } from "@/lib/safe-logging";

async function fetchBackend(url: string, options: RequestInit): Promise<Response> {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, options);
    logRequest("Proxy", options.method || "GET", url, startedAt, response.status, getCorrelationId(response.headers));
    return response;
  } catch (error) {
    logRequest("Proxy", options.method || "GET", url, startedAt, undefined, undefined, true);
    throw error;
  }
}

function supportHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  const correlationId = getCorrelationId(response.headers);
  if (correlationId) headers["X-Trace-Id"] = correlationId;
  const licenseState = response.headers.get("X-License-State");
  if (licenseState) headers["X-License-State"] = licenseState;
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) headers["Retry-After"] = retryAfter;
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const token = request.headers.get("authorization");
    const response = await fetchBackend(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    });

    const contentType = response.headers.get("content-type") || "";
    if (
      contentType.includes("text/html")
    ) {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { ...supportHeaders(response), "Content-Type": contentType },
      });
    }

    // Binary file downloads (Excel, zip, etc.)
    if (
      contentType.includes("application/vnd.openxmlformats") ||
      contentType.includes("application/pdf") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("application/zip") ||
      contentType.includes("image/") ||
      contentType.includes("video/")
    ) {
      const buffer = await response.arrayBuffer();
      const disposition = response.headers.get("content-disposition") || "";
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          ...supportHeaders(response),
          "Content-Type": contentType,
          ...(disposition && { "Content-Disposition": disposition }),
        },
      });
    }

    // 204/205 responses must not have a body (Fetch API spec)
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status, headers: supportHeaders(response) });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: supportHeaders(response) });
  } catch (error) {
    console.error("[Proxy GET] Request failed");
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend",
        data: null,
        errors: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    const headers: Record<string, string> = {};
    const auth = request.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    let body: BodyInit;
    if (isMultipart) {
      // Use formData() — fetch will set the correct Content-Type + boundary automatically
      body = await request.formData();
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(await request.json().catch(() => ({})));
    }

    const response = await fetchBackend(url, { method: "POST", headers, body });

    // 204/205 responses must not have a body (Fetch API spec)
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status, headers: supportHeaders(response) });
    }

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Backend returned non-JSON (HTML error page etc.)
      data = {
        success: false,
        message: response.ok
          ? "Unexpected response from server"
          : `Server error (${response.status})`,
        data: null,
        errors: [],
      };
    }
    return NextResponse.json(data, { status: response.status, headers: supportHeaders(response) });
  } catch (error) {
    console.error("[Proxy POST] Request failed");
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend",
        data: null,
        errors: [],
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const token = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));

    const response = await fetchBackend(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
      body: JSON.stringify(body),
    });

    // 204/205 responses must not have a body (Fetch API spec)
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status, headers: supportHeaders(response) });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: supportHeaders(response) });
  } catch (error) {
    console.error("[Proxy PUT] Request failed");
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend",
        data: null,
        errors: [],
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const token = request.headers.get("authorization");
    const body = await request.json().catch(() => ({}));

    const response = await fetchBackend(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
      body: JSON.stringify(body),
    });

    // 204/205 responses must not have a body (Fetch API spec)
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status, headers: supportHeaders(response) });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: supportHeaders(response) });
  } catch (error) {
    console.error("[Proxy PATCH] Request failed");
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend",
        data: null,
        errors: [],
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const token = request.headers.get("authorization");

    const response = await fetchBackend(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    });

    // 204/205 responses must not have a body (Fetch API spec)
    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, { status: response.status, headers: supportHeaders(response) });
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: supportHeaders(response) });
  } catch (error) {
    console.error("[Proxy DELETE] Request failed");
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to backend",
        data: null,
        errors: [],
      },
      { status: 500 },
    );
  }
}
