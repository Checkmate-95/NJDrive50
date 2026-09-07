// app/claim-zyropro/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClaimZyroProPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [extraField, setExtraField] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit =
    fullName.trim().length > 1 &&
    email.trim().includes("@") &&
    orderId.trim().length > 5 &&
    addressLine1.trim().length > 3 &&
    city.trim().length > 1 &&
    state.trim().length > 0 &&
    postalCode.trim().length > 2 &&
    country.trim().length > 1;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/claim-zyropro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          orderId: orderId.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          extraField,
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setSuccessMessage(
        "Thanks! We've received your ZyroPro claim. We'll verify your yearly subscription and email you shipping confirmation once your ZyroPro ships."
      );
    } catch (error) {
      console.error("ZyroPro claim submission failed:", error);
      setErrorMessage(
        "We couldn't submit your claim right now. Please try again or email support@njdrive50.com directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#08194A]">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-5 text-sm text-green-700 shadow-sm">
            {successMessage}
          </div>

          <Link
            href="/"
            className="mt-4 inline-block text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="inline-block text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-4 text-2xl font-extrabold">Claim Your Free ZyroPro</h1>

        <p className="mt-2 text-sm leading-6 text-[#08194A]/72">
          This promotion is offered directly by NJDrive50 and fulfilled by us —
          Google Play is not involved in or sponsoring this offer.
        </p>

        <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
          This offer is limited to the first 50 yearly NJDrive50 subscribers,
          while supplies last. Your Google Play Order ID will be used to verify
          your subscription before your ZyroPro ships.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-[#08194A]/10 bg-white px-4 py-5 shadow-sm">
          <div>
            <label
              htmlFor="claim-full-name"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
            >
              Full name
            </label>
            <input
              id="claim-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
            />
          </div>

          <div>
            <label
              htmlFor="claim-email"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
            >
              Email
            </label>
            <input
              id="claim-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
            />
          </div>

          <div>
            <label
              htmlFor="claim-order-id"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
            >
              Google Play Order ID
            </label>
            <input
              id="claim-order-id"
              type="text"
              placeholder="GPA.1234-5678-9012-34567"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
            />
            <p className="mt-1 text-xs text-[#08194A]/55">
              Found in your Google Play purchase confirmation email or order
              history.
            </p>
          </div>

          <div>
            <label
              htmlFor="claim-address-1"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
            >
              Address line 1
            </label>
            <input
              id="claim-address-1"
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
            />
          </div>

          <div>
            <label
              htmlFor="claim-address-2"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
            >
              Address line 2 (optional)
            </label>
            <input
              id="claim-address-2"
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="claim-city"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
              >
                City
              </label>
              <input
                id="claim-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
              />
            </div>

            <div>
              <label
                htmlFor="claim-state"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
              >
                State
              </label>
              <input
                id="claim-state"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="claim-postal"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
              >
                Postal code
              </label>
              <input
                id="claim-postal"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
              />
            </div>

            <div>
              <label
                htmlFor="claim-country"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
              >
                Country
              </label>
              <input
                id="claim-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-[#08194A]/40 focus:bg-white focus:ring-2 focus:ring-[#08194A]/10"
              />
            </div>
          </div>

          {/* Honeypot — hidden from real users via CSS, left empty by them.
              Bots that auto-fill every field will trip this and get rejected. */}
          <input
            type="text"
            name="extraField"
            tabIndex={-1}
            autoComplete="off"
            value={extraField}
            onChange={(e) => setExtraField(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
            aria-hidden="true"
          />

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || submitting}
            className="h-11 w-full rounded-xl bg-[#08194A] px-4 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Claim"}
          </button>
        </div>
      </div>
    </main>
  );
}