// src/screens/RestartOnboarding.tsx
import { useNav } from "../state/navStore"
import { clearProfile, clearTeenPhoto } from "../state/profileStore"

export default function RestartOnboarding() {
  const { resetTo, goBack } = useNav()

  const handleRestart = () => {
    clearProfile()
    clearTeenPhoto()
    resetTo("login")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-[#08194A]">
      <h1 className="text-2xl font-extrabold">Restart Onboarding</h1>

      <p className="max-w-sm text-center text-sm text-[#08194A]/70">
        This will reset your onboarding information and return you to the login screen.
      </p>

      <button
        type="button"
        onClick={handleRestart}
        className="w-full max-w-xs rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700"
      >
        Reset Onboarding
      </button>

      <button
        type="button"
        onClick={() => goBack("settings")}
        className="text-sm text-[#08194A]/60 transition hover:text-[#08194A]"
      >
        Cancel
      </button>
    </main>
  )
}