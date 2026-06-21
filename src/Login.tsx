import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { Preferences } from "@capacitor/preferences";

import { auth } from "./firebase";
import { useNav } from "./state/navStore";

const REMEMBER_EMAIL_KEY = "njdrive50_remembered_email";

function getFriendlyError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support for help.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function Login() {
  const { setScreen } = useNav();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ⭐ Load remembered email on mount
  useEffect(() => {
    async function loadRememberedEmail() {
      try {
        const { value } = await Preferences.get({ key: REMEMBER_EMAIL_KEY });
        if (value) {
          setEmail(value);
          setRememberMe(true);
        }
      } catch {
        // silent fail
      }
    }
    loadRememberedEmail();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // ⭐ Save or clear remembered email based on checkbox
      try {
        if (rememberMe) {
          await Preferences.set({ key: REMEMBER_EMAIL_KEY, value: email.trim() });
        } else {
          await Preferences.remove({ key: REMEMBER_EMAIL_KEY });
        }
      } catch {
        // silent fail
      }

      // ✅ Do nothing — startupController handles navigation via onAuthStateChanged

    } catch (err: unknown) {
      const firebaseErr = err as FirebaseError;
      setError(getFriendlyError(firebaseErr.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
            Welcome back
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A] sm:text-3xl">
            Sign in to NJDrive50
          </h1>
          <p className="mt-2 text-sm text-[#08194A]/60">
            Continue tracking your 50-hour permit journey.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-[#08194A]/10 bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8">
          <form onSubmit={handleLogin} noValidate className="space-y-5">
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/60"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setScreen("forgotPassword")}
                  className="text-xs font-semibold text-[#08194A]/50 transition hover:text-[#08194A]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#08194A]/40 transition hover:text-[#08194A]/70"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ⭐ Remember Me */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((prev) => !prev)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  rememberMe
                    ? "border-[#08194A] bg-[#08194A]"
                    : "border-[#08194A]/25 bg-white"
                }`}
              >
                {rememberMe && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path
                      d="M1 4L4 7.5L10 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span
                className="cursor-pointer select-none text-sm text-[#08194A]/70"
                onClick={() => setRememberMe((prev) => !prev)}
              >
                Remember my email
              </span>
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
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-[#08194A]/50">
          <button
            type="button"
            onClick={() => setScreen("register")}
            className="font-semibold text-[#08194A] underline-offset-2 hover:underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </main>
  );
}