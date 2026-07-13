import { useNav } from "./state/navStore"

export default function LandingPageApp() {
  const setScreen = useNav((s) => s.setScreen)

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -top-32 flex justify-center">
          <div className="h-[420px] w-[420px] rounded-full bg-[#38BDF8]/5 blur-[120px] sm:h-[500px] sm:w-[700px]" />
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16 sm:gap-10 md:flex-row md:items-center md:justify-between md:gap-12 md:py-24">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#38BDF8] sm:text-[11px] sm:tracking-[0.18em]">
                NEW NJ LAW — EFFECTIVE FEB 1, 2025
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              How to track your teen&apos;s{" "}
              <span className="text-[#38BDF8]">New Jersey 50-hour driving log</span>
            </h1>

            <p className="mt-4 text-base leading-7 text-white/75 sm:mt-5">
              NJDrive50 is the driving log app built for New Jersey families. Track supervised
              driving hours, separate daytime and night driving, monitor permit milestones, and
              stay organized for NJMVC Form BA-CSD.
            </p>

            <p className="mt-4 text-base leading-7 text-white/70">
              Keep your teen&apos;s driving practice, night hours, permit timeline, and road test
              preparation together in one place from permit day through the road test.
            </p>

            <div className="mt-6 grid max-w-xs grid-cols-3 gap-3">
              {[
                { value: "50", label: "Hours required" },
                { value: "10", label: "Night hours" },
                { value: "6 mo", label: "Wait period" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="flex min-h-[72px] flex-col justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
                >
                  <span className="text-xl font-extrabold text-[#38BDF8]">{value}</span>
                  <span className="text-[11px] text-white/55">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
              <button
                id="view-plans"
                type="button"
                onClick={() => setScreen("pricing")}
                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#38BDF8] px-6 py-3 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] transition hover:bg-[#0EA5E9] active:scale-[0.99] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
              >
                View plans
              </button>
            </div>

            <p className="mt-3 max-w-xl text-xs leading-6 text-white/55">
              7-day free trial, then $4.99/month or $39.99/year. Subscriptions renew
              automatically unless canceled through Google Play before the renewal date. Manage or
              cancel anytime in Google Play subscription settings.
            </p>
          </div>

          <div className="flex w-full flex-1 justify-center md:justify-end">
            <div className="w-full max-w-[220px] sm:max-w-[250px] md:max-w-[270px]">
              <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-b from-[#0F172A] to-[#020617] shadow-[0_30px_70px_rgba(15,23,42,0.72)]">
                <div className="flex flex-col gap-2.5 p-3.5 sm:p-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
                      Total Hours
                    </p>
                    <p className="mt-1 text-[22px] font-extrabold tabular-nums tracking-tight text-[#38BDF8] sm:text-[28px]">
                      32.5
                    </p>
                    <p className="mt-1 text-[10px] text-white/50">17.5 hours left</p>

                    <div className="mt-2.5">
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-label="Example driving-hour progress"
                        aria-valuemin={0}
                        aria-valuemax={50}
                        aria-valuenow={32.5}
                      >
                        <div
                          className="h-full rounded-full bg-[#38BDF8]"
                          style={{ width: "65%" }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-white/45 sm:text-[10px]">
                        <span>65% complete</span>
                        <span>Goal: 50 hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2.5 text-center">
                      <p className="text-sm font-extrabold tabular-nums text-yellow-400 sm:text-[15px]">
                        26.5h
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">
                        Day
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2.5 text-center">
                      <p className="text-sm font-extrabold tabular-nums text-[#38BDF8] sm:text-[15px]">
                        6.0h
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">
                        Night
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
                        Road test
                      </p>
                      <p className="mt-1 text-sm font-bold leading-none text-white">47 days</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
                        Left
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
                        Night hrs left
                      </p>
                      <p className="mt-1 text-sm font-bold tabular-nums text-yellow-400">
                        4.0 hrs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location notice: informational only; request runtime permission later in the drive-start flow */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-4 sm:p-5">
            <p className="text-sm font-bold text-[#38BDF8]">Location used for active drive logging</p>

            <p className="mt-2 max-w-3xl text-xs leading-6 text-white/65">
              When you choose to record a drive, NJDrive50 uses location to capture the route,
              distance, start time, and end time for that supervised-driving log. Location access
              is requested before a drive is recorded, and you can stop recording at any time.
            </p>

            <p className="mt-2 text-xs leading-6 text-white/50">
              For best accuracy, keep NJDrive50 open during your drive.
            </p>

            <button
              type="button"
              onClick={() => setScreen("privacy")}
              className="mt-3 text-xs font-semibold text-[#38BDF8] underline underline-offset-4 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
            >
              Read the Privacy Policy
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/45">
            <button
              type="button"
              onClick={() => setScreen("privacy")}
              className="underline underline-offset-2 transition hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
            >
              Privacy Policy
            </button>

            <span className="text-white/20">·</span>

            <button
              type="button"
              onClick={() => setScreen("terms")}
              className="underline underline-offset-2 transition hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
            >
              Terms of Service
            </button>

            <span className="text-white/20">·</span>

            <a
              href="mailto:support@njdrive50.com"
              className="transition hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
            >
              Support
            </a>
          </div>

          <p className="max-w-lg text-center text-[11px] leading-5 text-white/25">
            NJDrive50 is not affiliated with or endorsed by the New Jersey Motor Vehicle Commission
            (NJMVC). This app is an independent tool to help families track supervised driving
            hours.
          </p>

          <p className="text-[11px] text-white/20">
            © {new Date().getFullYear()} NJDrive50. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}