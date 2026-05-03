import { useNav } from "../state/navStore"

export default function RestartOnboarding() {
  const { setScreen } = useNav()

  const handleRestart = () => {
    // Only clear onboarding-related keys — not the entire app
    localStorage.removeItem("njdrive50_onboarding")
    localStorage.removeItem("njdrive50_onboarding_progress")

    // Optional: if you want to reset the teen photo
    localStorage.removeItem("njdrive50_profile_photo")

    // Optional: if you want to reset the home intro state
    localStorage.removeItem("njdrive50_intro_seen")

    setScreen("intro")
  }

  return (
    <main className="min-h-screen bg-white text-[#08194A] flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-2xl font-extrabold">Restart Onboarding</h1>

      <p className="text-sm text-[#08194A]/70 text-center max-w-sm">
        This will reset your onboarding information and return you to the setup screen.
      </p>

      <button
        onClick={handleRestart}
        className="w-full max-w-xs bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
      >
        Reset Onboarding
      </button>

      <button
        onClick={() => setScreen("settings")}
        className="text-sm text-[#08194A]/60 hover:text-[#08194A] transition"
      >
        Cancel
      </button>
    </main>
  )
}
