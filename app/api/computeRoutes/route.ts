import { NextResponse } from "next/server";
import axios from "axios";

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

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
      params: {
        origin,
        destination,
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    });

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const data = {
      origin,
      destination,
      distance: leg.distance.text,
      duration: leg.duration.text,
    };

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error("Route computation failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Route computation failed", details: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
