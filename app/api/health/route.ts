import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "NJDrive50 AI",
    message: "API healthy",
  });
}
