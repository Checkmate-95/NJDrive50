import type { Dispatch, SetStateAction } from "react"
import type { Screen } from "../App"

type HomeIntroContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}

export default function HomeIntroContent({
  setScreen,
}: HomeIntroContentProps) {
  return (
    <div className="flex w-full justify-center px-3 pt-4 text-[#08194A] sm:px-4">
      <section className="w-full max-w-2xl rounded-[32px] border border-[#08194A]/8 bg-white px-5 py-6 shadow-[0_14px_36px_rgba(0,0,0,0.08)] sm:px-7 sm:py-8">
        <div className="flex flex-col items-center text-center">
          <img
            src="/njdrive50Logo6.png"
            alt="NJDrive50 logo"
            className="h-20 w-auto sm:h-24"
          />

          <div className="mt-4 inline-flex items-center rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6500]">
  Built for New Jersey permit families
</div>




          <h1 className="mt-5 max-w-xl text-3xl font-extrabold tracking-tight text-[#08194A] sm:text-4xl">
            Track every practice drive with clarity and confidence
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#08194A]/68 sm:text-base">
            NJDrive50 helps New Jersey families log day and night driving hours, stay organized, and be fully prepared for the probationary license — without last‑minute stress.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
              Why families use it
            </p>

            <ul className="mt-3 space-y-3 text-sm leading-6 text-[#08194A]/72">
              <li className="flex items-start gap-2">
                <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                Track total, day, and night driving hours in one place
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                Keep a clean record ready for certification and review
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                Reduce surprises before the road test appointment
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
              More included
            </p>

            <ul className="mt-3 space-y-3 text-sm leading-6 text-[#08194A]/72">
              <li className="flex items-start gap-2">
                <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                Visual milestones that help teens stay motivated
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                A built-in New Jersey practice test in the same app
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                A guided setup flow for your driver profile and permit details
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
            New Jersey requirement
          </p>

          <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#08194A] sm:text-xl">
            50 total hours, including 10 night hours
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#08194A]/72">
            Drivers under 21 must complete 50 hours of supervised practice,
            including 10 hours at night, before qualifying for a probationary
            license if their permit was issued on or after February 1, 2025.
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setScreen("onboarding")}
            className="min-h-[52px] w-full rounded-2xl bg-[#08194A] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
          >
            Set Up My Driver Profile
          </button>

          <p className="mt-3 text-center text-xs leading-5 text-[#08194A]/50">
            Setup takes only a few minutes and helps keep your driving records organized from the start.
          </p>
        </div>
      </section>
    </div>
  )
}