// src/screens/RestartOnboarding.tsx
import { useNav } from "../state/navStore"
import { clearProfile, clearTeenPhoto } from "../state/profileStore"

export default function RestartOnboarding() {
  const { setScreen, goBack } = useNav()

  const handleRestart = () => {
    clearProfile()
    clearTeenPhoto()
    setScreen("intro")
  }

  return (
    <main className="min-h-screen bg-white text-[#08194A] flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-2xl font-extrabold">Restart Onboarding</h1>

      <p className="max-w-sm text-center text-sm text-[#08194A]/70">
        This will reset your onboarding information and return you to the setup screen.
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