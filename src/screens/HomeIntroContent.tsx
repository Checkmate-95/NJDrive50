// src/screens/HomeIntroContent.tsx
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
      <section className="w-full max-w-xl rounded-[28px] border border-white/30 bg-white/95 px-5 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6 sm:py-7">
        <div className="inline-flex items-center rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6500]">
          Built for New Jersey permit families
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Track every practice drive with confidence
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#08194A]/68 sm:text-base">
          NJDrive50 helps New Jersey families track supervised driving hours,
          separate night driving automatically, and stay ready for the road test
          without last-minute stress.
        </p>

        <div className="mt-5 rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC] p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
            Why families keep using it
          </p>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#08194A]/72">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#f9c80e]">•</span>
              Track total, day, and night driving hours in one place
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#f9c80e]">•</span>
              Keep a clean, organized record ready for certification
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#f9c80e]">•</span>
              Avoid last-minute surprises before the road test
            </li>
          </ul>
        </div>

        <div className="mt-5 rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC] p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
            More included
          </p>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#08194A]/72">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#f9c80e]">•</span>
              Visual milestones that help teens stay motivated
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#f9c80e]">•</span>
              A built-in New Jersey practice test in the same app
            </li>
          </ul>
        </div>

        <div className="mt-5 rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC] p-4 sm:p-5">
          <h2 className="text-lg font-bold tracking-tight text-[#08194A] sm:text-xl">
            New Jersey requirement
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#08194A]/72">
            Drivers under 21 must complete 50 hours of supervised practice,
            including 10 hours at night, before qualifying for a probationary
            license if their permit was issued on or after February 1, 2025.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScreen("onboarding")}
          className="mt-6 min-h-[48px] w-full rounded-xl bg-[#08194A] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
        >
          Set Up My Driver Profile
        </button>
      </section>
    </div>
  )
}