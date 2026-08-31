import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_PROMPT_LENGTH = 2000;
const ALLOWED_MODES = new Set(["faq", "chat"]);

const ALLOWED_ORIGINS = new Set([
  "https://www.njdrive50.com",
  "https://njdrive50.com",
  "https://localhost",
]);

function corsHeaders(origin?: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://www.njdrive50.com";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  try {
    const body = await req.json();
    const { prompt, mode } = body;
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";

    if (!cleanPrompt) {
      return NextResponse.json(
        { error: "Missing or empty prompt." },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (cleanPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.` },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Allowed: ${[...ALLOWED_MODES].join(", ")}` },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const systemPrompt =
      mode === "faq"
        ? [
            "You are NJDrive50's Help Panel AI.",
            "Give medium-length answers (3–5 sentences), clear explanations, practical guidance, and end with 'Why this matters:'.",
            "Tone: calm, confident, supportive.",
            "Do NOT ask questions back.",
          ].join("\n")
        : [
            "You are NJDrive50's conversational helper.",
            "Give warm, supportive, step-by-step guidance.",
            "Tone: warm, reassuring, detailed when needed.",
          ].join("\n");

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanPrompt },
      ],
      temperature: mode === "faq" ? 0.3 : 0.5,
    });

    const answer = completion.choices?.[0]?.message?.content ?? "";

    return NextResponse.json(
      { output: answer || "No response received." },
      { headers: corsHeaders(origin) }
    );
  } catch (err: any) {
    console.error("njdrive50-ai error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}