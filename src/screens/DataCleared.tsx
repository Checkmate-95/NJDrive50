import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { useNav } from "../state/navStore"

export default function DataCleared() {
  const { setScreen } = useNav()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6 text-[#08194A]">
      <CheckCircleIcon className="h-16 w-16 text-green-500" />
      <h1 className="text-2xl font-extrabold">Data Cleared</h1>
      <p className="max-w-sm text-center text-sm text-[#08194A]/70">
        All app data has been removed. You can start fresh from the beginning.
      </p>
      <button
        type="button"
        onClick={() => setScreen("intro")}
        className="w-full max-w-xs rounded-xl bg-[#08194A] py-3 font-semibold text-white transition hover:bg-[#0A1E5E]"
      >
        Get Started
      </button>
    </main>
  )
}