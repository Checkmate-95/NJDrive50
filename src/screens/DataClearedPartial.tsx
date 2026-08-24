import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useNav } from "../state/navStore";

export default function DataClearedPartial() {
  const { setScreen } = useNav();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-8 text-[#08194A]">
      <section
        className="w-full max-w-md rounded-3xl border border-[#08194A]/10 bg-white p-6 shadow-sm"
        aria-labelledby="data-deleted-title"
        aria-describedby="data-deleted-description"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircleIcon
            className="h-10 w-10 text-green-600"
            aria-hidden="true"
          />
        </div>

        <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
          Selected data deletion complete
        </p>

        <h1
          id="data-deleted-title"
          className="mt-2 text-center text-2xl font-extrabold tracking-tight text-[#08194A]"
        >
          Selected Data Deleted
        </h1>

        <p
          id="data-deleted-description"
          className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#08194A]/70"
        >
          Your selected NJDrive50 data has been deleted. Your account remains
          active, and you can continue using the app with your existing sign-in.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-5 text-amber-800">
            Some limited records may still be retained where required for legal,
            security, fraud-prevention, billing, or compliance reasons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScreen("settings")}
          className="mt-6 h-12 w-full rounded-xl bg-[#08194A] px-4 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08194A]"
        >
          Back to Settings
        </button>
      </section>
    </main>
  );
}