import type { Dispatch, SetStateAction } from "react";
import type { Screen } from "../App";

type HomeIntroContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>;
};

export default function HomeIntroContent({
  setScreen,
}: HomeIntroContentProps) {
  return (
    <div className="w-full px-3 pt-4 pb-6 text-[#08194A] sm:px-4">
      <div className="flex w-full justify-center">
        <section className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-[#08194A]/8 bg-white px-5 py-6 shadow-[0_14px_36px_rgba(0,0,0,0.08)] sm:px-7 sm:py-8">
          <img
            src="/njgreen.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-8 z-0 h-[620px] w-auto -translate-x-1/2 opacity-[0.24] sm:top-10 sm:h-[740px]"
          />

          <div className="relative z-10 flex flex-col items-center text-center">
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
              NJDrive50 helps New Jersey families log day and night driving hours,
              stay organized, and be fully prepared for the probationary license
              without last-minute stress.
            </p>
          </div>

          <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC]/95 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
                Why families use it
              </p>

              <ul className="mt-3 space-y-3 text-sm leading-6 text-[#08194A]/72">
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                  <span>Track total, day, and night driving hours in one place</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                  <span>Keep a clean record ready for certification and review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                  <span>Reduce surprises before the road test appointment</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC]/95 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
                More included
              </p>

              <ul className="mt-3 space-y-3 text-sm leading-6 text-[#08194A]/72">
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                  <span>Visual milestones that help teens stay motivated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                  <span>A built-in New Jersey practice test in the same app</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-[2px] font-bold text-[#f9c80e]">•</span>
                  <span>A guided setup flow for your driver profile and permit details</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-4 rounded-3xl border border-[#08194A]/10 bg-[#F7F9FC]/95 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/48">
              New Jersey requirement
            </p>

            <h2 className="mt-2 text-lg font-extrabold tracking-tight text-[#08194A] sm:text-xl">
              50 total hours, including 10 night hours
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#08194A]/72">
              For permit holders under 21 with a special learner&apos;s permit or
              examination permit issued on or after February 1, 2025, supervised
              driving must include at least 50 practice hours, including 10 hours
              during darkness, before licensure.
            </p>
          </div>

          <div className="relative z-10 mt-6">
            <button
              type="button"
              onClick={() => setScreen("onboarding")}
              className="min-h-[52px] w-full rounded-2xl bg-[#08194A] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f9c80e]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-0"
            >
              Set Up My Driver Profile
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-[#08194A]/50">
              Setup takes only a few minutes and helps keep your driving records
              organized from the start.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}