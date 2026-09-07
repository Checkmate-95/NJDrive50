import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ClaimPayload = {
  fullName: string;
  email: string;
  orderId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  extraField?: string; // honeypot — must stay empty
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// Loose sanity check, not real verification. Google Play Order IDs have
// used a few formats over the years, so this only rejects obvious
// nonsense ("123", "asdf") rather than enforcing one rigid pattern that
// could reject a legitimate but differently-formatted real order ID.
const ORDER_ID_SANITY_REGEX = /^GPA\.[\d-]{10,}$/;

function validatePayload(data: unknown): { valid: boolean; error?: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, error: "Invalid submission." };
  }

  const d = data as Partial<ClaimPayload>;

  // Honeypot: real users never fill this hidden field. If it's filled,
  // treat as spam without revealing why.
  if (isNonEmptyString(d.extraField)) {
    return { valid: false, error: "Invalid submission." };
  }

  if (!isNonEmptyString(d.fullName) || d.fullName.length > 200) {
    return { valid: false, error: "Full name is required." };
  }
  if (!isNonEmptyString(d.email) || !d.email.includes("@") || d.email.length > 320) {
    return { valid: false, error: "A valid email is required." };
  }
  if (!isNonEmptyString(d.orderId) || d.orderId.length > 100) {
    return { valid: false, error: "A valid Google Play Order ID is required." };
  }
  if (!ORDER_ID_SANITY_REGEX.test(d.orderId.trim())) {
    return {
      valid: false,
      error: "Order ID format looks incorrect. It should start with \"GPA.\" — check your Google Play purchase confirmation email.",
    };
  }
  if (!isNonEmptyString(d.addressLine1) || d.addressLine1.length > 300) {
    return { valid: false, error: "A valid shipping address is required." };
  }
  if (!isNonEmptyString(d.city) || d.city.length > 150) {
    return { valid: false, error: "City is required." };
  }
  if (!isNonEmptyString(d.state) || d.state.length > 150) {
    return { valid: false, error: "State is required." };
  }
  if (!isNonEmptyString(d.postalCode) || d.postalCode.length > 20) {
    return { valid: false, error: "Postal code is required." };
  }
  if (!isNonEmptyString(d.country) || d.country.length > 100) {
    return { valid: false, error: "Country is required." };
  }
  if (d.addressLine2 !== undefined && typeof d.addressLine2 !== "string") {
    return { valid: false, error: "Invalid address line 2." };
  }

  return { valid: true };
}

// Minimal in-memory rate limit — resets on server restart/redeploy, and
// won't work correctly across multiple serverless instances, but for a
// temporary, low-traffic giveaway endpoint this is a reasonable guard
// against a single abusive client hammering the route.
const submissionTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionTimestamps.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    submissionTimestamps.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  submissionTimestamps.set(ip, timestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() ?? "unknown";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const data = await req.json();
    const validation = validatePayload(data);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      fullName,
      email,
      orderId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = data as ClaimPayload;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ZYROPRO_MAIL_USER,
        pass: process.env.ZYROPRO_MAIL_PASS,
      },
    });

    const mailText = `
ZyroPro Giveaway Claim Submitted

Full Name: ${fullName}
Email: ${email}
Google Play Order ID: ${orderId}

Shipping Address:
${addressLine1}
${addressLine2 ? addressLine2 + "\n" : ""}${city}, ${state} ${postalCode}
${country}

Submitted at: ${new Date().toISOString()}
    `;

    await transporter.sendMail({
      from: `"NJDrive50 Giveaway" <${process.env.ZYROPRO_MAIL_USER}>`,
      to: "support@njdrive50.com",
      replyTo: email,
      subject: `New ZyroPro Giveaway Claim — ${fullName}`,
      text: mailText,
    });

    // Confirmation email to the submitter. Failure here shouldn't fail
    // the whole request — the admin notification above already went
    // through, so the claim is recorded either way.
    try {
      await transporter.sendMail({
        from: `"NJDrive50 Giveaway" <${process.env.ZYROPRO_MAIL_USER}>`,
        to: email,
        subject: "Your ZyroPro Giveaway Claim Was Received",
        text: `Hi ${fullName},

Thanks for submitting your ZyroPro giveaway claim!

We'll verify your yearly NJDrive50 subscription using your Google Play Order ID and email you again once your ZyroPro ships.

If you have any questions, reply to this email.

— NJDrive50 Team`,
      });
    } catch (confirmationError) {
      console.error("ZyroPro confirmation email failed:", confirmationError);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ZyroPro claim error:", err);
    return NextResponse.json(
      { error: "Failed to submit claim" },
      { status: 500 }
    );
  }
}