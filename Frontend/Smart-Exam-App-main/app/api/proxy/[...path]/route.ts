import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5221/api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`

  console.log(`[Proxy GET] ${url}`)

  try {
    const token = request.headers.get("authorization")
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    })

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("text/html") || contentType.includes("application/pdf")) {
      const text = await response.text()
      return new NextResponse(text, {
        status: response.status,
        headers: { "Content-Type": contentType },
      })
    }

    const data = await response.json().catch(() => ({}))
    console.log(`[Proxy GET Response] ${url}`, { status: response.status, data })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(`[Proxy GET Error] ${url}`, error)
    return NextResponse.json(
      { success: false, message: "Failed to connect to backend", data: null, errors: [] },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`

  console.log(`[Proxy POST] ${url}`)

  try {
    const contentType = request.headers.get("content-type") || ""
    const isMultipart = contentType.includes("multipart/form-data")

    const headers: Record<string, string> = {}
    const auth = request.headers.get("authorization")
    if (auth) headers["Authorization"] = auth
    if (isMultipart) headers["Content-Type"] = contentType
    else headers["Content-Type"] = "application/json"

    const body = isMultipart ? await request.arrayBuffer() : JSON.stringify(await request.json().catch(() => ({})))

    const response = await fetch(url, { method: "POST", headers, body })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(`[Proxy POST Error] ${url}`, error)
    return NextResponse.json(
      { success: false, message: "Failed to connect to backend", data: null, errors: [] },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`

  console.log(`[Proxy PUT] ${url}`)

  try {
    const token = request.headers.get("authorization")
    const body = await request.json().catch(() => ({}))

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))
    console.log(`[Proxy PUT Response] ${url}`, { status: response.status, data })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(`[Proxy PUT Error] ${url}`, error)
    return NextResponse.json(
      { success: false, message: "Failed to connect to backend", data: null, errors: [] },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${path.join("/")}${searchParams ? `?${searchParams}` : ""}`

  console.log(`[Proxy DELETE] ${url}`)

  try {
    const token = request.headers.get("authorization")

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: token }),
      },
    })

    const data = await response.json().catch(() => ({}))
    console.log(`[Proxy DELETE Response] ${url}`, { status: response.status, data })

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error(`[Proxy DELETE Error] ${url}`, error)
    return NextResponse.json(
      { success: false, message: "Failed to connect to backend", data: null, errors: [] },
      { status: 500 },
    )
  }
}
