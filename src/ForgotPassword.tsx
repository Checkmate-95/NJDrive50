import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import type { FirebaseError } from "firebase/app";

import { auth } from "./firebase";
import { useNav } from "./state/navStore";

function getFriendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function ForgotPassword() {
  const { setScreen, goBack } = useNav();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const firebaseErr = err as FirebaseError;
      setError(getFriendlyError(firebaseErr.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
              Check your inbox
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A] sm:text-3xl">
              Reset link sent
            </h1>
            <p className="mt-2 text-sm text-[#08194A]/60">
              We sent a password reset link to{" "}
              <span className="font-semibold text-[#08194A]">{email}</span>.
              Follow the instructions in the email, then sign in with your new
              password.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#08194A]/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8 space-y-4">
            {/* Email icon */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#08194A]/5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#08194A"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScreen("login")}
              className="min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E]"
            >
              Back to sign in
            </button>

            <button
              type="button"
              onClick={() => goBack()}
              className="min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
            >
              ← Go back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
            Account recovery
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A] sm:text-3xl">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-[#08194A]/60">
            Enter the email you use for NJDrive50 and we&apos;ll send you a
            reset link.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-[#08194A]/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8">
          <form onSubmit={handleReset} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-sm text-[#08194A] placeholder-[#08194A]/30 outline-none transition focus:border-[#08194A]/40 focus:ring-2 focus:ring-[#08194A]/10"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-[#08194A]/50">
          <button
            type="button"
            onClick={() => goBack()}
            className="font-semibold text-[#08194A] underline-offset-2 hover:underline"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => setScreen("landing")}
            className="hover:text-[#08194A]/70"
          >
            Back to home
          </button>
        </div>
      </div>
    </main>
  );
}