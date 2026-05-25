import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BASIC_AUTH_ENABLED = process.env.BASIC_AUTH_ENABLED === "true"
const USERNAME = process.env.BASIC_AUTH_USERNAME
const PASSWORD = process.env.BASIC_AUTH_PASSWORD

export function middleware(req: NextRequest) {
  if (!BASIC_AUTH_ENABLED) {
    return NextResponse.next()
  }

  if (!USERNAME || !PASSWORD) {
    return new NextResponse("Basic auth is enabled but not configured", {
      status: 500,
    })
  }

  const authHeader = req.headers.get("authorization")
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`

  if (authHeader !== expectedAuth) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="NJDrive50 Staging"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
}