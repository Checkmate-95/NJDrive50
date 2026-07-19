export const config = {
  matcher: "/(.*)",
}

export default function middleware(request: Request) {
  const BASIC_AUTH_ENABLED = process.env.BASIC_AUTH_ENABLED === "true"

  if (!BASIC_AUTH_ENABLED) {
    return
  }

  const USERNAME = process.env.BASIC_AUTH_USERNAME
  const PASSWORD = process.env.BASIC_AUTH_PASSWORD

  if (!USERNAME || !PASSWORD) {
    return new Response("Basic auth is enabled but not configured", {
      status: 500,
    })
  }

  const authHeader = request.headers.get("authorization")

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ")

    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded)
        const separatorIndex = decoded.indexOf(":")
        const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : ""
        const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : ""

        if (username === USERNAME && password === PASSWORD) {
          return
        }
      } catch {
        // fall through to 401
      }
    }
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="NJDrive50 Staging"' },
  })
}
