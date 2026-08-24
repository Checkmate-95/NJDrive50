import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useNav } from "../state/navStore";

export default function DataClearedFull() {
  const { setScreen } = useNav();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-8 text-[#08194A]">
      <section
        className="w-full max-w-md rounded-3xl border border-[#08194A]/10 bg-white p-6 shadow-sm"
        aria-labelledby="account-deleted-title"
        aria-describedby="account-deleted-description"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircleIcon
            className="h-10 w-10 text-green-600"
            aria-hidden="true"
          />
        </div>

        <p className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
          Account deletion complete
        </p>

        <h1
          id="account-deleted-title"
          className="mt-2 text-center text-2xl font-extrabold tracking-tight text-[#08194A]"
        >
          Account Deleted
        </h1>

        <p
          id="account-deleted-description"
          className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#08194A]/70"
        >
          Your NJDrive50 account and associated data have been deleted. You can
          no longer sign in with this account, and this action cannot be undone.
        </p>

        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs leading-5 text-red-700">
            Limited records may still be retained where required for legal,
            security, fraud-prevention, or compliance reasons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScreen("intro")}
          className="mt-6 h-12 w-full rounded-xl bg-[#08194A] px-4 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08194A]"
        >
          Return to Start
        </button>
      </section>
    </main>
  );
}