// src/screens/DeleteAccount.tsx
import { useMemo, useState } from "react"
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { httpsCallable } from "firebase/functions"
import { auth, functions } from "../firebase"
import { useNav } from "../state/navStore"

type DeleteAccountResult = {
  success: boolean
}

type DeleteStep = "idle" | "working" | "success"

function getErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : ""

  switch (code) {
    case "auth/requires-recent-login":
      return "For security, please re-enter your password before deleting your account."
    case "auth/wrong-password":
      return "That password is incorrect. Please try again."
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again."
    case "functions/unauthenticated":
      return "Please sign in again before deleting your account."
    case "functions/failed-precondition":
      return "Your account could not be deleted right now. Please contact support."
    default:
      return "We could not delete your account right now. Please try again."
  }
}

export default function DeleteAccount() {
  const { goBack, setScreen } = useNav()

  const [acknowledged, setAcknowledged] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [password, setPassword] = useState("")
  const [needsRecentLogin, setNeedsRecentLogin] = useState(false)
  const [step, setStep] = useState<DeleteStep>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const user = auth.currentUser
  const email = user?.email ?? ""

  const deleteMyAccount = useMemo(
    () => httpsCallable<Record<string, never>, DeleteAccountResult>(functions, "deleteMyAccount"),
    []
  )

  const canSubmit =
    acknowledged && confirmText.trim().toUpperCase() === "DELETE"

  const openWebDeletion = () => {
    window.open("https://njdrive50.com/delete-account", "_blank", "noopener,noreferrer")
  }

  const handleDeleteAccount = async () => {
    if (!user) {
      setErrorMessage("You must be signed in to delete your account.")
      return
    }

    if (!canSubmit || step === "working") return

    setErrorMessage("")
    setSuccessMessage("")
    setStep("working")

    try {
      if (needsRecentLogin) {
        if (!email || !password.trim()) {
          setStep("idle")
          setErrorMessage("Please enter your password to continue.")
          return
        }

        const credential = EmailAuthProvider.credential(email, password)
        await reauthenticateWithCredential(user, credential)
      }

      await deleteMyAccount({})

      setSuccessMessage("Your account and associated data have been deleted.")
      setStep("success")

      await auth.signOut()

      setScreen("dataCleared")
    } catch (error) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : ""

      if (code === "auth/requires-recent-login") {
        setNeedsRecentLogin(true)
      }

      setStep("idle")
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 pb-20 pt-3 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">
        <header className="rounded-2xl border border-[#08194A]/10 bg-white px-4 py-4 shadow-sm">
          <button
            type="button"
            onClick={() => goBack("settings")}
            className="mb-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/70 transition hover:bg-[#EEF3FA]"
          >
            ← Back to Settings
          </button>

          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#DC2626]">
              Account
            </p>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              Delete Account
            </span>
          </div>

          <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#08194A]">
            Delete Account
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#08194A]/72">
            This permanently deletes your NJDrive50 account and associated personal data. If you
            only want to remove specific data while keeping your account, use the separate Delete
            App Data option instead.
          </p>
        </header>

        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold text-red-800">
              What happens when you delete your account
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-red-700">
              <li>• Your NJDrive50 account will be permanently deleted.</li>
              <li>• Your access to sign in and use account-based features will be removed.</li>
              <li>• Your associated app data will be deleted, except where limited retention is required for legal, security, fraud-prevention, or compliance reasons.</li>
              <li>• This action cannot be undone.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-[#08194A]">Confirm permanent deletion</p>

            <label className="mt-3 flex items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border border-[#08194A]/20"
              />
              <span className="text-xs leading-5 text-[#08194A]/80">
                I understand that deleting my account permanently removes my account access and
                associated personal data, subject to limited retention explained in the Privacy
                Policy.
              </span>
            </label>

            <div className="mt-3">
              <label
                htmlFor="confirm-delete-account"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
              >
                Type DELETE to continue
              </label>
              <input
                id="confirm-delete-account"
                type="text"
                autoCapitalize="characters"
                autoCorrect="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>

            {needsRecentLogin && (
              <div className="mt-3">
                <label
                  htmlFor="delete-account-password"
                  className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
                >
                  Re-enter your password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
                />
                <p className="mt-1 text-[11px] leading-5 text-[#08194A]/65">
                  For security, Firebase may require a recent sign-in before account deletion.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {successMessage}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleDeleteAccount()}
              disabled={
                !canSubmit ||
                step === "working" ||
                (needsRecentLogin && !password.trim())
              }
              className="mt-4 h-11 w-full rounded-xl border border-red-200 bg-red-600 px-4 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "working"
                ? needsRecentLogin
                  ? "Confirming Deletion..."
                  : "Deleting Account..."
                : "Delete My Account"}
            </button>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold text-[#08194A]">
              Prefer to request deletion on the website?
            </p>
            <p className="mt-1 text-xs leading-5 text-[#08194A]/70">
              You can also request account and associated data deletion through our secure web
              page if you no longer have access to the app.
            </p>
            <button
              type="button"
              onClick={openWebDeletion}
              className="mt-2 h-10 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 text-xs font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
            >
              Open Account Deletion Page
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}