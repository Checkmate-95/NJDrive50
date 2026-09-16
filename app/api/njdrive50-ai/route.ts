// Force redeploy
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_PROMPT_LENGTH = 2000;
const ALLOWED_MODES = new Set(["faq", "chat"]);

const ALLOWED_ORIGINS = new Set([
  "https://www.njdrive50.com",
  "https://njdrive50.com",
  "http://localhost:5173",
  "http://localhost:3000",
]);

function getCorsHeaders(origin?: string | null) {
  const headers = new Headers();

  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://www.njdrive50.com";

  headers.set("Access-Control-Allow-Origin", allowedOrigin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");

  return headers;
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  try {
    const body = await req.json();

    const { prompt, mode } = body;
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";

    if (!cleanPrompt) {
      return Response.json(
        { error: "Missing or empty prompt." },
        {
          status: 400,
          headers: getCorsHeaders(origin),
        }
      );
    }

    if (cleanPrompt.length > MAX_PROMPT_LENGTH) {
      return Response.json(
        { error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.` },
        {
          status: 400,
          headers: getCorsHeaders(origin),
        }
      );
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return Response.json(
        {
          error: `Invalid mode. Allowed: ${[...ALLOWED_MODES].join(", ")}`,
        },
        {
          status: 400,
          headers: getCorsHeaders(origin),
        }
      );
    }

    const systemPrompt =
      mode === "faq"
        ? [
            "You are NJDrive50's Help Panel AI for a New Jersey teen-driver practice-log app.",
            "Give medium-length answers of 3–5 sentences with clear explanations and practical guidance.",
            "End every FAQ answer with a separate sentence beginning exactly: 'Why this matters:'.",
            "Tone: calm, confident, supportive, parent-friendly, and teen-friendly.",
            "Do NOT ask questions back.",
            "Do not invent NJDrive50 app features, legal requirements, deadlines, documents, or DMV/MVC policies.",
            "When a New Jersey legal or MVC rule may change, tell the user to verify it with the New Jersey MVC.",
            "",
            "NJDrive50 compass and heading guidance:",
            "- A compass warning can appear when a phone's magnetic sensor needs calibration or is affected by nearby magnets or metal.",
            "- Recommend removing the phone from magnetic mounts, magnetic chargers, magnetic cases, speaker magnets, keys, or other nearby metal/magnetic objects.",
            "- To calibrate, hold the phone away from magnetic accessories and move it slowly in a figure-eight pattern.",
            "- Keep the phone reasonably flat or upright as directed by the app. A sideways position, sharp tilt, or nearby magnetic accessory can make heading less reliable.",
            "- Compass heading is separate from trip duration and distance tracking. A compass warning should not normally erase logged driving hours or stop time and distance from being recorded.",
            "- At normal driving speed, GPS-based course direction may be more useful than the phone compass. Compass readings can be less stable while stopped or moving slowly.",
            "- If the warning continues after removing interference and calibrating, suggest restarting the app, checking relevant location and motion permissions, and restarting the phone.",
            "- Never say calibration guarantees perfect accuracy. Never say a compass problem changes, deletes, or resets logged driving hours.",
            "",
            "When the user asks about the compass, a compass warning, calibration, heading, phone orientation, mounts, chargers, magnets, or direction, use the guidance above. Keep the answer concise and explain that the practice log can generally continue recording time and distance normally.",
          ].join("\n")
        : [
            "You are NJDrive50's conversational helper.",
            "Give warm, supportive, step-by-step guidance.",
            "Tone: warm, reassuring, and detailed when needed.",
            "Do not invent NJDrive50 features, legal requirements, deadlines, documents, or New Jersey MVC policies.",
            "If a New Jersey legal or MVC requirement may have changed, advise the user to verify it with the New Jersey MVC.",
          ].join("\n");

    // NEW OPENAI SDK CALL — FIXES THE 500 ERROR
    const completion = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanPrompt },
      ],
      temperature: mode === "faq" ? 0.3 : 0.5,
    });

    const answer = completion.output_text ?? "";

    return Response.json(
      {
        output: answer || "No response received.",
      },
      {
        headers: getCorsHeaders(origin),
      }
    );
  } catch (err) {
    console.error("njdrive50-ai error:", err);

    return Response.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
        headers: getCorsHeaders(origin),
      }
    );
  }
}
