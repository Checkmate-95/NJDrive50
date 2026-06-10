import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";

import { auth } from "./firebase";
import { useNav } from "./state/navStore";

function getFriendlyError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 8 characters.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Account registration is not enabled. Please contact support.";
    case "auth/admin-restricted-operation":
      return "Sign-up is currently restricted. Please contact support.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ─── Eye icons (shared) ──────────────────────────────────────────────────────

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function Register() {
  const { setScreen } = useNav();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Verification state ────────────────────────────────────────────────────
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [continueLoading, setContinueLoading] = useState(false);

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(user);
      setVerificationSent(true);
    } catch (err: unknown) {
      const firebaseErr = err as FirebaseError;
      setError(getFriendlyError(firebaseErr.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification email ─────────────────────────────────────────────
  const handleResend = async () => {
    setResendMessage(null);
    setResendLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found.");
      await sendEmailVerification(user);
      setResendMessage("Verification email resent! Check your inbox.");
    } catch (err: unknown) {
      const firebaseErr = err as FirebaseError;
      setResendMessage(getFriendlyError(firebaseErr.code));
    } finally {
      setResendLoading(false);
    }
  };

  // ── Continue after verifying ──────────────────────────────────────────────
  const handleContinue = async () => {
    setContinueError(null);
    setContinueLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user session.");

      // Reload to get the latest emailVerified status from Firebase
      await user.reload();

      if (user.emailVerified) {
        setScreen("intro");
      } else {
        setContinueError(
          "Your email hasn't been verified yet. Please click the link in your inbox, then try again."
        );
      }
    } catch {
      setContinueError("Couldn't check verification status. Please try again.");
    } finally {
      setContinueLoading(false);
    }
  };

  // ── Verification banner ───────────────────────────────────────────────────
  if (verificationSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
              One More Step
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A] sm:text-3xl">
              Verify your email
            </h1>
            <p className="mt-2 text-sm text-[#08194A]/60">
              We sent a verification link to{" "}
              <span className="font-semibold text-[#08194A]">{email}</span>.
              Open it, then come back.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[28px] border border-[#08194A]/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8 space-y-5">
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

            {/* Instruction steps */}
            <ol className="space-y-2 text-sm text-[#08194A]/70">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#08194A] text-[10px] font-bold text-white">
                  1
                </span>
                Open your email inbox
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#08194A] text-[10px] font-bold text-white">
                  2
                </span>
                Click the verification link from NJDrive50
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#08194A] text-[10px] font-bold text-white">
                  3
                </span>
                Return here and tap <strong className="text-[#08194A]">Continue to App</strong>
              </li>
            </ol>

            {/* Continue error */}
            {continueError && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
              >
                {continueError}
              </div>
            )}

            {/* Resend feedback */}
            {resendMessage && (
              <p
                role="status"
                className="text-center text-xs text-[#08194A]/60"
              >
                {resendMessage}
              </p>
            )}

            {/* Continue button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={continueLoading}
              className="min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {continueLoading ? "Checking…" : "Continue to App →"}
            </button>

            {/* Resend */}
            <p className="text-center text-xs text-[#08194A]/50">
              Didn't receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="font-semibold text-[#08194A] underline-offset-2 hover:underline disabled:opacity-50"
              >
                {resendLoading ? "Sending…" : "Resend email"}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setScreen("login")}
              className="text-sm font-semibold text-[#08194A] underline-offset-2 hover:underline"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
            Create Account
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A] sm:text-3xl">
            Sign up for NJDrive50
          </h1>
          <p className="mt-2 text-sm text-[#08194A]/60">
            Enter your email and password to get started.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-[#08194A]/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8">
          <form onSubmit={handleRegister} noValidate className="space-y-5">
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

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/60"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 pr-11 text-sm text-[#08194A] placeholder-[#08194A]/30 outline-none transition focus:border-[#08194A]/40 focus:ring-2 focus:ring-[#08194A]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#08194A]/40 hover:text-[#08194A]/70 transition"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#08194A]/40">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/60"
              >
                Confirm Password
              </label>
              <div className="relative mt-2">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 pr-11 text-sm text-[#08194A] placeholder-[#08194A]/30 outline-none transition focus:border-[#08194A]/40 focus:ring-2 focus:ring-[#08194A]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#08194A]/40 hover:text-[#08194A]/70 transition"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
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
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-[#08194A]/50">
          <button
            type="button"
            onClick={() => setScreen("login")}
            className="font-semibold text-[#08194A] underline-offset-2 hover:underline"
          >
            ← Back to sign in
          </button>
          <button
            type="button"
            onClick={() => setScreen("landing")}
            className="hover:text-[#08194A]/70"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </main>
  );
}