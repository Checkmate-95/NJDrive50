"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"

const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
]

const ORDER_ID_RE = /^GPA\.\d{4}-\d{4}-\d{4}-\d{5}(\.\.\d+)?$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ZIP_RE = /^\d{5}(-\d{4})?$/
const MAX_CLAIMS = 50
const TERMS_HREF = "/zyropro-promotion-terms"
const SUPPORT_EMAIL = "support@njdrive50.com"
const SUPPORT_HREF = "mailto:" + SUPPORT_EMAIL

type Field =
  | "fullName"
  | "email"
  | "orderId"
  | "addressLine1"
  | "city"
  | "state"
  | "postalCode"
  | "attestsEligibility"
  | "agreesToRules"

type PromoState =
  | { state: "loading" }
  | { state: "open" }
  | { state: "closed"; title: string; message: string }

const CLOSED_TITLE = "ZyroPro promotion is closed"
const UNAVAILABLE_TITLE = "Claims temporarily unavailable"

const ALL_FIELDS_TOUCHED: Record<Field, boolean> = {
  fullName: true,
  email: true,
  orderId: true,
  addressLine1: true,
  city: true,
  state: true,
  postalCode: true,
  attestsEligibility: true,
  agreesToRules: true,
}

const inputClasses =
  "h-11 w-full rounded-xl border bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"

const labelClasses =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"

const termsLinkClasses = "font-bold text-[#08194A] underline underline-offset-2"

function normalizeOrderId(value: string) {
  return value.replace(/\s+/g, "").toUpperCase()
}

function SupportEmailLink() {
  return <a href={SUPPORT_HREF} className="font-bold underline underline-offset-2">{SUPPORT_EMAIL}</a>
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="inline-block text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
        >
          ← Back to Home
        </Link>
        {children}
      </div>
    </main>
  )
}

export default function ClaimZyroProPage() {
  const [promo, setPromo] = useState<PromoState>({ state: "loading" })
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [orderId, setOrderId] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [attestsEligibility, setAttestsEligibility] = useState(false)
  const [agreesToRules, setAgreesToRules] = useState(false)
  const [extraField, setExtraField] = useState("")
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [claimId, setClaimId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/claim-zyropro", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { open?: boolean; reason?: string; message?: string }) => {
        if (cancelled) return
        if (data?.open === true) {
          setPromo({ state: "open" })
        } else {
          setPromo({
            state: "closed",
            title: data?.reason === "unavailable" ? UNAVAILABLE_TITLE : CLOSED_TITLE,
            message: data?.message ?? "This promotion is not currently accepting claims.",
          })
        }
      })
      .catch(() => {
        // The status check could not reach the server, so a submission would
        // almost certainly fail too. Tell the user instead of showing the form.
        if (!cancelled) {
          setPromo({
            state: "closed",
            title: UNAVAILABLE_TITLE,
            message: "Claim status is temporarily unavailable. Please refresh the page and try again.",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const errors: Partial<Record<Field, string>> = {}

  if (fullName.trim().length < 2) {
    errors.fullName = "Enter your full name."
  }

  if (!EMAIL_RE.test(email.trim())) {
    errors.email = "Enter a valid email address."
  }

  if (!ORDER_ID_RE.test(normalizeOrderId(orderId))) {
    errors.orderId = "Use the format GPA.1234-5678-9012-34567."
  }

  if (addressLine1.trim().length < 4) {
    errors.addressLine1 = "Enter your street address."
  }

  if (city.trim().length < 2) {
    errors.city = "Enter your city."
  }

  if (!state) {
    errors.state = "Select your state."
  }

  if (!ZIP_RE.test(postalCode.trim())) {
    errors.postalCode = "Enter a valid 5-digit ZIP code."
  }

  if (!attestsEligibility) {
    errors.attestsEligibility =
      "You must be a U.S. legal resident, 18 or older, and the subscription holder."
  }

  if (!agreesToRules) {
    errors.agreesToRules = "You must agree to the Promotion Terms."
  }

  const canSubmit = Object.keys(errors).length === 0

  const touch = (field: Field) => {
    setTouched((previous) =>
      previous[field] ? previous : { ...previous, [field]: true }
    )
  }

  const showError = (field: Field) => (touched[field] ? errors[field] : undefined)

  const borderFor = (field: Field) =>
    showError(field) ? "border-red-400" : "border-[#08194A]/10"

  const fieldError = (field: Field) => {
    const message = showError(field)
    return message ? (
      <p id={`${field}-error`} className="mt-1 text-xs leading-5 text-red-600">
        {message}
      </p>
    ) : null
  }

  const a11y = (field: Field) => ({
    "aria-invalid": showError(field) ? true : undefined,
    "aria-describedby": showError(field) ? `${field}-error` : undefined,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      setTouched(ALL_FIELDS_TOUCHED)
      return
    }

    if (submitting) return

    setErrorMessage("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/claim-zyropro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          orderId: normalizeOrderId(orderId),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state,
          postalCode: postalCode.trim(),
          country: "United States",
          attestsEligibility,
          agreesToRules,
          extraField,
        }),
      })

      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; claimId?: string; error?: string; reason?: string }
        | null

      if (response.status === 403 && result?.reason) {
        setPromo({
          state: "closed",
          title: CLOSED_TITLE,
          message: result.error ?? "This promotion is not currently accepting claims.",
        })
        return
      }

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "We couldn't submit your claim right now.")
      }

      setClaimId(result.claimId ?? "")
    } catch (error) {
      console.error("ZyroPro claim submission failed:", error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't submit your claim right now. Please try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (promo.state === "loading") {
    return (
      <PageShell>
        <div
          role="status"
          className="mt-5 rounded-3xl border border-[#08194A]/10 bg-white px-5 py-8 text-sm text-[#08194A]/70"
        >
          Checking promotion status...
        </div>
      </PageShell>
    )
  }

  if (promo.state === "closed") {
    return (
      <PageShell>
        <div className="mt-5 rounded-3xl border border-[#08194A]/10 bg-white px-5 py-6 shadow-[0_12px_32px_rgba(8,25,74,0.08)] sm:px-7 sm:py-8">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {promo.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#08194A]/70">{promo.message}</p>
          <p className="mt-3 text-sm leading-6 text-[#08194A]/70">
            If you already submitted a claim, we will email you with its status.
            Questions? Contact <SupportEmailLink />.
          </p>
          <Link
            href={TERMS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-block text-sm ${termsLinkClasses}`}
          >
            View the Promotion Terms
          </Link>
        </div>
      </PageShell>
    )
  }

  if (claimId !== null) {
    return (
      <PageShell>
        <div
          role="status"
          className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-sm leading-6 text-green-800 shadow-sm"
        >
          We received your claim for review
          {claimId ? ` (reference ${claimId})` : ""}. We will verify your
          eligibility, including your yearly NJDrive50 subscription, completed
          7-day trial, successful $29.99 yearly payment, and claim order, then
          email you with your claim status.
        </div>

        <p className="mt-4 text-sm leading-6 text-[#08194A]/60">
          Submission does not guarantee qualification or shipment. The promotion
          is limited to the first {MAX_CLAIMS} valid eligible claims received.
        </p>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="mt-5 rounded-3xl border border-[#08194A]/10 bg-white px-5 py-6 shadow-[0_12px_32px_rgba(8,25,74,0.08)] sm:px-7 sm:py-8">
        <div className="inline-flex rounded-full bg-[#F9C80E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08194A]">
          Limited launch promotion
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Submit a ZyroPro dashboard mount claim
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#08194A]/70">
          This promotion is offered and fulfilled by Organic Brands LLC, doing
          business as NJDrive50. Google Play does not sponsor or fulfill this
          promotion.
        </p>

        <div className="mt-5 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-4 text-sm leading-6 text-[#08194A]/70">
          <p className="font-bold text-[#08194A]">Eligibility requirements</p>

          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Limited to the first {MAX_CLAIMS} valid eligible claims received,
              based on server receipt time. One claim per person, yearly order,
              email address, shipping address, and household.
            </li>
            <li>
              Your 7-day free trial must have ended and the $29.99 yearly
              subscription payment must have successfully processed.
            </li>
            <li>
              You must be a U.S. legal resident, 18 or older, and the holder of
              the eligible yearly subscription.
            </li>
            <li>
              You must provide a valid Google Play Order ID and a U.S. shipping
              address.
            </li>
            <li>
              NJDrive50 reviews each claim and verifies eligibility before
              approval or fulfillment.
            </li>
          </ul>

          <Link
            href={TERMS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-block ${termsLinkClasses}`}
          >
            Read the full Promotion Terms
          </Link>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <div>
            <label htmlFor="claim-full-name" className={labelClasses}>
              Full name
            </label>
            <input
              id="claim-full-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              onBlur={() => touch("fullName")}
              className={`${inputClasses} ${borderFor("fullName")}`}
              {...a11y("fullName")}
            />
            {fieldError("fullName")}
          </div>

          <div>
            <label htmlFor="claim-email" className={labelClasses}>
              Email
            </label>
            <input
              id="claim-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => touch("email")}
              className={`${inputClasses} ${borderFor("email")}`}
              {...a11y("email")}
            />
            {fieldError("email")}
          </div>

          <div>
            <label htmlFor="claim-order-id" className={labelClasses}>
              Google Play Order ID
            </label>
            <input
              id="claim-order-id"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="GPA.1234-5678-9012-34567"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              onBlur={() => {
                setOrderId((value) => normalizeOrderId(value))
                touch("orderId")
              }}
              className={`${inputClasses} ${borderFor("orderId")}`}
              {...a11y("orderId")}
            />
            {fieldError("orderId") ?? (
              <p className="mt-1 text-xs leading-5 text-[#08194A]/60">
                Find this in your Google Play purchase confirmation email or
                Google Play order history after the yearly payment is processed.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="claim-address-1" className={labelClasses}>
              U.S. shipping address
            </label>
            <input
              id="claim-address-1"
              type="text"
              autoComplete="address-line1"
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              onBlur={() => touch("addressLine1")}
              className={`${inputClasses} ${borderFor("addressLine1")}`}
              {...a11y("addressLine1")}
            />
            {fieldError("addressLine1")}
          </div>

          <div>
            <label htmlFor="claim-address-2" className={labelClasses}>
              Address line 2 <span className="normal-case">(optional)</span>
            </label>
            <input
              id="claim-address-2"
              type="text"
              autoComplete="address-line2"
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              className={`${inputClasses} border-[#08194A]/10`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="claim-city" className={labelClasses}>
                City
              </label>
              <input
                id="claim-city"
                type="text"
                autoComplete="address-level2"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                onBlur={() => touch("city")}
                className={`${inputClasses} ${borderFor("city")}`}
                {...a11y("city")}
              />
              {fieldError("city")}
            </div>

            <div>
              <label htmlFor="claim-state" className={labelClasses}>
                State
              </label>
              <select
                id="claim-state"
                autoComplete="address-level1"
                value={state}
                onChange={(event) => setState(event.target.value)}
                onBlur={() => touch("state")}
                className={`${inputClasses} ${borderFor("state")}`}
                {...a11y("state")}
              >
                <option value="">Select a state</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              {fieldError("state")}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="claim-postal" className={labelClasses}>
                ZIP code
              </label>
              <input
                id="claim-postal"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={10}
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                onBlur={() => touch("postalCode")}
                className={`${inputClasses} ${borderFor("postalCode")}`}
                {...a11y("postalCode")}
              />
              {fieldError("postalCode")}
            </div>

            <div>
              <label htmlFor="claim-country" className={labelClasses}>
                Country
              </label>
              <input
                id="claim-country"
                type="text"
                value="United States"
                disabled
                className="h-11 w-full cursor-not-allowed rounded-xl border border-[#08194A]/10 bg-[#EEF3FA] px-3 text-sm text-[#08194A]/60 outline-none"
              />
            </div>
          </div>

          <input
            type="text"
            name="extraField"
            tabIndex={-1}
            autoComplete="off"
            value={extraField}
            onChange={(event) => setExtraField(event.target.value)}
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
            aria-hidden="true"
          />

          <div className="space-y-3 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-4">
            <div>
              <label className="flex items-start gap-3 text-sm leading-6 text-[#08194A]/80">
                <input
                  type="checkbox"
                  checked={attestsEligibility}
                  onChange={(event) => {
                    setAttestsEligibility(event.target.checked)
                    touch("attestsEligibility")
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#08194A]"
                  {...a11y("attestsEligibility")}
                />
                <span>
                  I am a legal resident of the United States, 18 or older, and
                  the holder of this NJDrive50 yearly subscription.
                </span>
              </label>
              {fieldError("attestsEligibility")}
            </div>

            <div>
              <label className="flex items-start gap-3 text-sm leading-6 text-[#08194A]/80">
                <input
                  type="checkbox"
                  checked={agreesToRules}
                  onChange={(event) => {
                    setAgreesToRules(event.target.checked)
                    touch("agreesToRules")
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#08194A]"
                  {...a11y("agreesToRules")}
                />
                <span>
                  I have read and agree to the{" "}
                  <Link
                    href={TERMS_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={termsLinkClasses}
                  >
                    Promotion Terms
                  </Link>
                  .
                </span>
              </label>
              {fieldError("agreesToRules")}
            </div>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-6 text-red-700"
            >
              {errorMessage} Questions? Contact <SupportEmailLink />.
            </div>
          ) : null}

          <p className="text-xs leading-5 text-[#08194A]/60">
            By submitting this claim, you authorize NJDrive50 to use the
            information you provide to review eligibility, contact you about the
            promotion, prevent fraud, and ship the mount if your claim qualifies.
            See our{" "}
            <Link
              href="/privacy"
              className="font-semibold text-[#08194A] underline underline-offset-2"
            >
              Privacy Policy
            </Link>{" "}
            for details.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting claim..." : "Submit claim for review"}
          </button>
        </form>
      </div>
    </PageShell>
  )
}