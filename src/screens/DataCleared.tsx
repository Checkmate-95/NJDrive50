import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { useNav } from "../state/navStore"

export default function DataCleared() {
  const { setScreen } = useNav()

  return (
    <main className="min-h-screen bg-white text-[#08194A] flex flex-col items-center justify-center p-6 gap-6">
      <CheckCircleIcon className="h-16 w-16 text-green-500" />
      <h1 className="text-2xl font-extrabold">Data Cleared</h1>
      <p className="text-sm text-[#08194A]/70 text-center max-w-sm">
        All app data has been removed. You can start fresh from the beginning.
      </p>
      <button
        onClick={() => setScreen("intro")}
        className="w-full max-w-xs bg-[#08194A] text-white py-3 rounded-xl font-semibold hover:bg-[#0A1E5E] transition"
      >
        Get Started
      </button>
    </main>
  )
}