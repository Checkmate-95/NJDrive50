// C:\Dev\NJDRIVE50\src\VerifyEmail.tsx
import { useState } from "react";
import { sendEmailVerification, signOut } from "firebase/auth";

import { auth } from "../firebase";
import { startupController } from "../../core/startupController";

function getFirebaseErrorCode(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
  ) {
    return (err as { code: string }).code;
  }
  return "";
}

function getFriendlyResendError(code: string): string {
  switch (code) {
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Couldn't resend the email. Please try again.";
  }
}

export default function VerifyEmail() {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [continueLoading, setContinueLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const email = auth.currentUser?.email ?? "your email";

  const handleContinue = async () => {
    setContinueError(null);
    setContinueLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user session.");

      // Reload to get the latest emailVerified status from Firebase.
      await user.reload();

      if (user.emailVerified) {
        // Re-run startupController now that verification is confirmed —
        // this routes to intro/onboarding/home based on actual profile
        // status, rather than assuming every verified user is brand new.
        await startupController(user);
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

  const handleResend = async () => {
    setResendMessage(null);
    setResendLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found.");
      await sendEmailVerification(user);
      setResendMessage("Verification email resent! Check your inbox.");
    } catch (err: unknown) {
      const code = getFirebaseErrorCode(err);
      setResendMessage(getFriendlyResendError(code));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged in App.tsx handles navigation back to "login".
    } catch {
      setSignOutLoading(false);
    }
  };

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
            <p role="status" className="text-center text-xs text-[#08194A]/60">
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
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="text-sm font-semibold text-[#08194A] underline-offset-2 hover:underline disabled:opacity-50"
          >
            {signOutLoading ? "Signing out…" : "← Sign out and use a different account"}
          </button>
        </div>
      </div>
    </main>
  );
}