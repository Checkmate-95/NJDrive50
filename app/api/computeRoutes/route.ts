import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { origin, destination } = body;

  // Example placeholder logic — replace with your real route computation
  const data = {
    origin,
    destination,
    distance: "12.4 mi",
    duration: "22 min",
  };

  return NextResponse.json(data, { headers: corsHeaders });
}

