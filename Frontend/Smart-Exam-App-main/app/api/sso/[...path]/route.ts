import { type NextRequest, NextResponse } from "next/server"
import { backendApiUrl } from "@/lib/server/backend-config"
import { getCorrelationId, logRequest } from "@/lib/safe-logging"

// Browser-facing authentication gateway. Cookies and redirects must survive the
// proxy; provider codes/tokens must never be sent through client-side JavaScript.
async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const route = path.join("/")
  const allowed = request.method === "GET"
    ? /^(providers|session|start\/(uaepass|government)|callback\/(uaepass|government))$/
    : /^(link|complete|cancel)$/
  if (!allowed.test(route)) return new NextResponse(null, { status: 404 })
  const started = Date.now()
  const headers = new Headers()
  for (const name of ["cookie", "content-type", "x-sso-csrf"]) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  try {
    const response = await fetch(`${backendApiUrl}/sso/${route}${request.nextUrl.search}`, {
      method: request.method, headers, redirect: "manual", cache: "no-store",
      ...(request.method === "POST" ? { body: await request.text() } : {}),
    })
    const outgoing = new Headers({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" })
    for (const name of ["content-type", "location", "x-trace-id", "retry-after"]) {
      const value = response.headers.get(name)
      if (value) outgoing.set(name, value)
    }
    for (const cookie of response.headers.getSetCookie()) outgoing.append("set-cookie", cookie)
    logRequest("Auth", request.method, `/api/sso/${route}`, started, response.status, getCorrelationId(response.headers))
    return new NextResponse(response.status === 204 ? null : await response.arrayBuffer(), {
      status: response.status, headers: outgoing,
    })
  } catch {
    logRequest("Auth", request.method, `/api/sso/${route}`, started, undefined, undefined, true)
    return NextResponse.json({ success: false, message: "Sign-in service is temporarily unavailable." }, {
      status: 502, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    })
  }
}

export const GET = forward
export const POST = forward
