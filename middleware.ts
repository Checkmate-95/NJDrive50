import { NextResponse } from "next/server";

export function middleware(req) {
  const auth = req.headers.get("authorization");
  const expected = "Basic " + btoa("njdrive50:devaccess"); // change if needed

  if (auth !== expected) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }
}
