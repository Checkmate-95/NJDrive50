import { createHash } from "crypto"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore"
import { getAdminDb } from "../../../lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ─── Promotion configuration (must match the published terms) ────────────────
// Claims open ONLY when both are true:
//   1. ZYROPRO_PROMO_OPEN is exactly "true" (server-side env var; default closed)
//   2. getPromotionWindow() returns dates that match the published terms
//
// To open the promotion: set the real start and end dates together here,
// publish the same dates in the terms page, deploy, then set the env var.
function getPromotionWindow(): PromotionWindow | null {
  // Example (endAt is exclusive; use -04:00 during daylight time, -05:00 otherwise):
  // return {
  //   startAt: new Date("YYYY-MM-DDT00:00:00-04:00"),
  //   endAt: new Date("YYYY-MM-DDT00:00:00-05:00"),
  //   termsVersion: "YYYY-MM-DD",
  // }
  return null
}

const MAX_CLAIMS = 50
const SUPPORT_EMAIL = "support@njdrive50.com"

const CLAIMS_COLLECTION = "zyroproClaims"
const LOCKS_COLLECTION = "zyroproClaimLocks"
const QUALIFYING_STATUSES = ["verified", "shipped"]

type PromotionWindow = { startAt: Date; endAt: Date; termsVersion: string }

type Claim = {
  fullName: string
  email: string
  orderId: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: "United States"
}

type ClosedReason = "disabled" | "not_started" | "ended" | "full" | "unavailable"

type PromotionStatus =
  | { open: true; termsVersion: string }
  | { open: false; reason: ClosedReason; message: string }

type ValidationResult = { ok: true; claim: Claim } | { ok: false; error: string }

type EmailResult = { adminEmailSent: boolean; confirmationEmailSent: boolean }

// ─── Validation ──────────────────────────────────────────────────────────────
const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
])

// Google Play order IDs: GPA.1234-5678-9012-34567, renewals append ..0, ..1, etc.
const ORDER_ID_RE = /^GPA\.\d{4}-\d{4}-\d{4}-\d{5}(\.\.\d+)?$/
// Rejects commas, semicolons, angle brackets and quotes so one address
// cannot smuggle extra recipients into Reply-To.
const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>".]+(\.[^\s@,;<>".]+)*\.[A-Za-z]{2,}$/
const ZIP_RE = /^\d{5}(-\d{4})?$/
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,99}$/u
const ADDRESS_RE = /^[\p{L}\p{M}\d][\p{L}\p{M}\d #.,'/-]{0,199}$/u
const URL_LIKE_RE = /(https?:|www\.|\.(com|net|org|io|co|ru|xyz|info|biz|link|app|site|online)\b)/i

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const cleaned = value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s{2,}/g, " ").trim()
  if (!cleaned || cleaned.length > maxLength) return null
  return cleaned
}

function validatePayload(data: unknown): ValidationResult {
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Invalid submission." }
  }

  const raw = data as Record<string, unknown>

  // Honeypot: real users never fill this field.
  if (typeof raw.extraField === "string" && raw.extraField.trim().length > 0) {
    return { ok: false, error: "Invalid submission." }
  }

  if (raw.attestsEligibility !== true) {
    return {
      ok: false,
      error: "You must confirm that you are a U.S. legal resident, 18 or older, and the holder of the yearly subscription.",
    }
  }

  if (raw.agreesToRules !== true) {
    return { ok: false, error: "You must agree to the Promotion Terms." }
  }

  const fullName = cleanString(raw.fullName, 100)
  if (!fullName || !NAME_RE.test(fullName) || URL_LIKE_RE.test(fullName)) {
    return { ok: false, error: "Enter your full name using letters, spaces, periods, apostrophes, or hyphens." }
  }

  const email = cleanString(raw.email, 254)?.toLowerCase() ?? null
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "A valid email address is required." }
  }

  const orderId = cleanString(raw.orderId, 40)?.replace(/\s+/g, "").toUpperCase() ?? null
  if (!orderId || !ORDER_ID_RE.test(orderId)) {
    return {
      ok: false,
      error: "Order ID format looks incorrect. It should look like GPA.1234-5678-9012-34567. Check your Google Play purchase confirmation email.",
    }
  }

  const addressLine1 = cleanString(raw.addressLine1, 200)
  if (!addressLine1 || addressLine1.length < 4 || !ADDRESS_RE.test(addressLine1) || URL_LIKE_RE.test(addressLine1)) {
    return { ok: false, error: "A valid street address is required." }
  }

  let addressLine2 = ""
  if (raw.addressLine2 !== undefined && raw.addressLine2 !== null && raw.addressLine2 !== "") {
    if (typeof raw.addressLine2 !== "string") {
      return { ok: false, error: "Invalid address line 2." }
    }
    const line2 = cleanString(raw.addressLine2, 200)
    if (line2 !== null && (!ADDRESS_RE.test(line2) || URL_LIKE_RE.test(line2))) {
      return { ok: false, error: "Invalid address line 2." }
    }
    addressLine2 = line2 ?? ""
  }

  const city = cleanString(raw.city, 100)
  if (!city || city.length < 2 || !NAME_RE.test(city) || URL_LIKE_RE.test(city)) {
    return { ok: false, error: "A valid city is required." }
  }

  const state = cleanString(raw.state, 2)?.toUpperCase() ?? null
  if (!state || !US_STATE_CODES.has(state)) {
    return { ok: false, error: "Select a valid U.S. state." }
  }

  const postalCode = cleanString(raw.postalCode, 10)
  if (!postalCode || !ZIP_RE.test(postalCode)) {
    return { ok: false, error: "A valid 5-digit ZIP code is required." }
  }

  if (raw.country !== "United States") {
    return { ok: false, error: "This promotion is available only for U.S. shipping addresses." }
  }

  return {
    ok: true,
    claim: { fullName, email, orderId, addressLine1, addressLine2, city, state, postalCode, country: "United States" },
  }
}

// ─── Promotion status ────────────────────────────────────────────────────────
const NOT_OPEN_MESSAGE = "This promotion is not open yet. Claims are not being accepted."

// Flag and schedule only. No database access, so it is safe to call first and
// it fails closed if anything is missing or misconfigured.
function getScheduleStatus(now = Date.now()): PromotionStatus {
  const flag = (process.env.ZYROPRO_PROMO_OPEN ?? "").trim()

  if (flag !== "true") {
    return { open: false, reason: "disabled", message: NOT_OPEN_MESSAGE }
  }

  const window = getPromotionWindow()

  if (
    !window ||
    !window.termsVersion ||
    Number.isNaN(window.startAt.getTime()) ||
    Number.isNaN(window.endAt.getTime()) ||
    window.endAt.getTime() <= window.startAt.getTime()
  ) {
    return { open: false, reason: "disabled", message: NOT_OPEN_MESSAGE }
  }

  if (now < window.startAt.getTime()) {
    return { open: false, reason: "not_started", message: "This promotion has not started yet." }
  }

  if (now >= window.endAt.getTime()) {
    return { open: false, reason: "ended", message: "This promotion has ended." }
  }

  return { open: true, termsVersion: window.termsVersion }
}

async function getPromotionStatus(db: Firestore): Promise<PromotionStatus> {
  const scheduled = getScheduleStatus()
  if (!scheduled.open) return scheduled

  const qualifying = await db.collection(CLAIMS_COLLECTION).where("status", "in", QUALIFYING_STATUSES).count().get()

  if (qualifying.data().count >= MAX_CLAIMS) {
    return { open: false, reason: "full", message: `All ${MAX_CLAIMS} promotional mounts have been claimed. This promotion has ended.` }
  }

  return scheduled
}

// ─── Duplicate locks ─────────────────────────────────────────────────────────
class DuplicateClaimError extends Error {}

function lockId(kind: "order" | "email" | "address", value: string) {
  return `${kind}_${createHash("sha256").update(value).digest("hex")}`
}

function addressKey(claim: Claim) {
  return [claim.addressLine1, claim.addressLine2, claim.city, claim.state, claim.postalCode.slice(0, 5)]
    .join("|")
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, "")
}

// ─── Rate limit (best-effort, per instance) ──────────────────────────────────
// A speed bump only. For real protection use your host's firewall / rate limiting.
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 3
const RATE_LIMIT_MAX_TRACKED_IPS = 5_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()

  if (submissionTimestamps.size > RATE_LIMIT_MAX_TRACKED_IPS) {
    for (const [key, timestamps] of submissionTimestamps) {
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
      if (recent.length === 0) submissionTimestamps.delete(key)
      else submissionTimestamps.set(key, recent)
    }
  }

  const timestamps = (submissionTimestamps.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    submissionTimestamps.set(ip, timestamps)
    return true
  }

  timestamps.push(now)
  submissionTimestamps.set(ip, timestamps)
  return false
}

// ─── Email notifications (never throw; Firestore is the record) ──────────────
async function sendClaimEmails(
  claim: Claim,
  claimId: string,
  receivedAtIso: string,
  termsVersion: string
): Promise<EmailResult> {
  const result: EmailResult = { adminEmailSent: false, confirmationEmailSent: false }

  const mailUser = process.env.ZYROPRO_MAIL_USER
  const mailPass = process.env.ZYROPRO_MAIL_PASS

  if (!mailUser || !mailPass) {
    console.error("ZyroPro mail configuration is missing; claim was stored but no email was sent.")
    return result
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: mailUser, pass: mailPass },
  })

  const reviewText = `ZyroPro Promotion Claim Received

Claim ID: ${claimId}
Received (server time): ${receivedAtIso}
Status: pending

Review steps:
1. Look up this Order ID in Play Console > Order management.
2. Confirm it is a yearly NJDrive50 subscription.
3. Confirm any applicable free trial ended and the first $29.99 yearly payment processed.
4. Confirm the order was not refunded, reversed, or charged back.
5. Review pending claims in receivedAt order.
6. In Firestore (${CLAIMS_COLLECTION}/${claimId}), set status to "verified" or "rejected".
7. If rejected and the claimant may resubmit, delete the documents listed in lockIds from ${LOCKS_COLLECTION}.
8. After shipping, set status to "shipped".

Claimant attested: U.S. legal resident, 18+, subscription holder = YES
Claimant agreed to Promotion Terms (version ${termsVersion}) = YES

Full Name: ${claim.fullName}
Email: ${claim.email}
Google Play Order ID: ${claim.orderId}

Shipping Address:
${claim.addressLine1}
${claim.addressLine2 ? `${claim.addressLine2}\n` : ""}${claim.city}, ${claim.state} ${claim.postalCode}
${claim.country}
`

  try {
    await transporter.sendMail({
      from: `"NJDrive50 Promotions" <${mailUser}>`,
      to: SUPPORT_EMAIL,
      replyTo: claim.email,
      subject: `ZyroPro Claim for Review - ${claim.orderId}`,
      text: reviewText,
    })
    result.adminEmailSent = true
  } catch (error) {
    console.error("ZyroPro admin notification email failed:", error)
  }

  try {
    await transporter.sendMail({
      from: `"NJDrive50 Promotions" <${mailUser}>`,
      to: claim.email,
      subject: "Your NJDrive50 ZyroPro Claim Was Received",
      text: `Hi ${claim.fullName},

We received your ZyroPro dashboard mount claim for review.

Claim reference: ${claimId}

Submission does not guarantee qualification or shipment. We will verify your eligibility, including your qualifying NJDrive50 yearly subscription, completion of any applicable free trial, successful first $29.99 yearly payment, and claim order under the Promotion Terms. We will email you with your claim status.

The promotion is limited to the first ${MAX_CLAIMS} valid eligible claims received. Google Play does not sponsor or fulfill this promotion.

If you have questions, reply to this email or contact ${SUPPORT_EMAIL}.

- NJDrive50 Team`,
    })
    result.confirmationEmailSent = true
  } catch (error) {
    console.error("ZyroPro claimant confirmation email failed:", error)
  }

  return result
}

// ─── GET: promotion status for the claim page ────────────────────────────────
export async function GET() {
  const noStore = { "Cache-Control": "no-store" }

  // Closed states are answered without touching Firebase.
  const scheduled = getScheduleStatus()
  if (!scheduled.open) {
    return NextResponse.json(scheduled, { headers: noStore })
  }

  try {
    const status = await getPromotionStatus(getAdminDb())
    return NextResponse.json(status.open ? { open: true } : status, { headers: noStore })
  } catch (error) {
    console.error("ZyroPro status check failed:", error)
    return NextResponse.json(
      { open: false, reason: "unavailable", message: "Claims are temporarily unavailable. Please try again later." },
      { status: 503, headers: noStore }
    )
  }
}

// ─── POST: submit a claim ────────────────────────────────────────────────────
export async function POST(req: Request) {
  // Fail closed first: no body parsing, validation, email, or Firestore access
  // while the promotion is not open.
  const scheduled = getScheduleStatus()
  if (!scheduled.open) {
    return NextResponse.json({ error: scheduled.message, reason: scheduled.reason }, { status: 403 })
  }

  const forwardedFor = req.headers.get("x-forwarded-for")
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown"

  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  let data: unknown
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 })
  }

  const validation = validatePayload(data)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const claim = validation.claim

  let db: Firestore
  let status: PromotionStatus

  try {
    db = getAdminDb()
    status = await getPromotionStatus(db)
  } catch (error) {
    console.error("ZyroPro claim setup failed:", error)
    return NextResponse.json({ error: "Claim submission is temporarily unavailable. Please try again later." }, { status: 503 })
  }

  if (!status.open) {
    return NextResponse.json({ error: status.message, reason: status.reason }, { status: 403 })
  }

  const termsVersion = status.termsVersion

  // Renewals share the base order ID (GPA.x-x-x-x..0), so strip the suffix.
  const orderIdBase = claim.orderId.replace(/\.\.\d+$/, "")
  const claimRef = db.collection(CLAIMS_COLLECTION).doc()
  const lockIds = [lockId("order", orderIdBase), lockId("email", claim.email), lockId("address", addressKey(claim))]
  const lockRefs = lockIds.map((id) => db.collection(LOCKS_COLLECTION).doc(id))

  try {
    await db.runTransaction(async (tx) => {
      const lockSnaps = await tx.getAll(...lockRefs)

      if (lockSnaps.some((snap) => snap.exists)) {
        throw new DuplicateClaimError()
      }

      tx.create(claimRef, {
        ...claim,
        orderIdBase,
        status: "pending",
        receivedAt: FieldValue.serverTimestamp(),
        eligibilityVerifiedAt: null,
        attestsEligibility: true,
        agreesToRules: true,
        termsVersion,
        lockIds,
        adminEmailSent: null,
        confirmationEmailSent: null,
      })

      for (const ref of lockRefs) {
        tx.create(ref, { claimId: claimRef.id, createdAt: FieldValue.serverTimestamp() })
      }
    })
  } catch (error) {
    if (error instanceof DuplicateClaimError) {
      return NextResponse.json(
        {
          error: `A claim has already been submitted for this order, email address, or shipping address. Only one claim is allowed. If you believe this is a mistake, contact ${SUPPORT_EMAIL}.`,
        },
        { status: 409 }
      )
    }

    console.error("ZyroPro claim storage failed:", error)
    return NextResponse.json({ error: "Failed to submit claim. Please try again later." }, { status: 500 })
  }

  let receivedAtIso = new Date().toISOString()
  try {
    const stored = await claimRef.get()
    const receivedAt = stored.get("receivedAt")
    if (receivedAt instanceof Timestamp) {
      receivedAtIso = receivedAt.toDate().toISOString()
    }
  } catch (error) {
    console.error("ZyroPro receivedAt read failed:", error)
  }

  const emailResult = await sendClaimEmails(claim, claimRef.id, receivedAtIso, termsVersion)

  // Record email outcome for manual follow-up. Never affects the saved claim.
  try {
    await claimRef.update({
      adminEmailSent: emailResult.adminEmailSent,
      confirmationEmailSent: emailResult.confirmationEmailSent,
      emailAttemptedAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.error("ZyroPro email status update failed:", error)
  }

  return NextResponse.json({ ok: true, claimId: claimRef.id })
}