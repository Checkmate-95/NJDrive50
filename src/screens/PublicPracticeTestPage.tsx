// src/screens/PublicPracticeTestPage.tsx

import PracticeTestPanel from "./PracticeTestPanel"

const LANDING_PAGE_URL = "https://your-landing-page-url.com"

export default function PublicPracticeTestPage() {
  return (
    <div className="min-h-screen bg-[#08194A] px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

          <div className="p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              Free NJ Practice Test
            </p>

            <h1 className="mt-2 text-3xl font-black leading-tight text-[#08194A]">
              Prepare for the New Jersey permit test
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#08194A]/72">
              Take a free 23-question practice round based on common New Jersey
              knowledge-test topics. Finish the quiz, then visit NJDrive50 to
              track supervised driving hours and support the full permit journey.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="#practice-test"
                className="flex w-full items-center justify-center rounded-xl bg-[#08194A] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
              >
                Start Practice Test
              </a>

              <a
                href={LANDING_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.18)] transition hover:-translate-y-[1px] hover:brightness-105"
              >
                Visit NJDrive50
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center">
                <p className="text-lg font-black text-[#08194A]">23</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                  Questions
                </p>
              </div>

              <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center">
                <p className="text-lg font-black text-[#08194A]">Random</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                  Each Attempt
                </p>
              </div>

              <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center">
                <p className="text-lg font-black text-[#08194A]">Free</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                  Study Tool
                </p>
              </div>
            </div>
          </div>
        </div>

        <div id="practice-test">
          <PracticeTestPanel />
        </div>

        <div className="mt-5 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#08194A] via-[#f9c80e] to-[#ffe27a]" />

          <div className="p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              Beyond the quiz
            </p>

            <h2 className="mt-2 text-2xl font-black leading-tight text-[#08194A]">
              Practice is only one part of the process
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[#08194A]/72">
              NJDrive50 helps families go beyond study mode with supervised
              driving-hour tracking, progress visibility, and support for
              staying aligned with NJ GDL expectations.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-[#08194A]/80">
              <li className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2">
                Track supervised driving hours in one place.
              </li>
              <li className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2">
                Stay organized as your teen works through NJ requirements.
              </li>
              <li className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2">
                Turn practice into real progress for the permit journey.
              </li>
            </ul>

            <a
              href={LANDING_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.18)] transition hover:-translate-y-[1px] hover:brightness-105"
            >
              Learn More About NJDrive50
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}