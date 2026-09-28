import { Browser } from "@capacitor/browser"
import { useNav } from "./state/navStore"

const PRICING_URL = "https://www.njdrive50.com/pricing"
const PROMO_TERMS_URL = "https://www.njdrive50.com/zyropro-promotion-terms"

export default function LandingPageApp() {
  const setScreen = useNav((s) => s.setScreen)

  const openWebsite = (url: string) => {
    void Browser.open({ url })
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -top-32 flex justify-center">
          <div className="h-[420px] w-[420px] rounded-full bg-[#38BDF8]/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col gap-9 px-4 py-12 sm:py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="relative max-w-xl">
            <p className="inline-flex rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#38BDF8]">
              Built for New Jersey parents and teen drivers
            </p>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Keep your teen&apos;s{" "}
              <span className="text-[#38BDF8]">
                NJ driving hours and road-test timeline
              </span>{" "}
              in one place
            </h1>

            <p className="mt-5 text-base leading-7 text-white/75">
              NJDrive50 helps New Jersey families organize supervised practice,
              see day and night driving progress, track permit milestones, and
              prepare for NJMVC Form BA-CSD.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-sm sm:gap-3">
              {[
                { value: "50", label: "Hours to track" },
                { value: "10", label: "Night hours" },
                { value: "6 mo", label: "Permit wait" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center"
                >
                  <span className="block text-xl font-extrabold text-[#38BDF8]">
                    {value}
                  </span>
                  <span className="text-[10px] text-white/55">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setScreen("about")}
                className="min-h-[48px] rounded-xl bg-[#38BDF8] px-6 py-3 text-sm font-extrabold text-[#020617] transition hover:bg-[#0EA5E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
              >
                See how it works
              </button>
              <button
                type="button"
                onClick={() => openWebsite(PRICING_URL)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                View pricing details
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[280px] md:mx-0">
            <div className="rounded-[30px] border border-white/15 bg-gradient-to-b from-[#0F172A] to-[#020617] p-4 shadow-[0_30px_70px_rgba(15,23,42,0.72)]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
                  Supervised hours
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[#38BDF8]">
                  32.5
                </p>
                <p className="text-xs text-white/50">17.5 hours remaining</p>
                <div
                  role="progressbar"
                  aria-label="Example supervised driving progress"
                  aria-valuemin={0}
                  aria-valuemax={50}
                  aria-valuenow={32.5}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                >
                  <div className="h-full w-[65%] rounded-full bg-[#38BDF8]" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="font-extrabold text-yellow-400">26.5h</p>
                  <p className="text-[10px] uppercase text-white/45">Day</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="font-extrabold text-[#38BDF8]">6.0h</p>
                  <p className="text-[10px] uppercase text-white/45">Night</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-white/45">
              Example dashboard. All progress shown is sample data.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="text-xl font-extrabold">
            Simple subscription options
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Premium access is $4.99 per month or $29.99 per year through Google
            Play. Eligible new subscribers may receive a 7-day free trial on
            either plan. Google Play shows your eligible offer and billing terms
            before you subscribe. Manage or cancel through Google Play.
          </p>
          <button
            type="button"
            onClick={() => openWebsite(PRICING_URL)}
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-bold text-[#38BDF8] underline underline-offset-4"
          >
            Compare plans on our website
          </button>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F9C80E]">
            Yearly launch promotion · Coming soon
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            A chance to claim a free ZyroPro dashboard mount
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            The first 50 valid eligible claims from yearly subscribers qualify
            after an applicable trial ends and the first $29.99 yearly payment
            succeeds. Monthly plans do not qualify. U.S. residents 18+ only;
            claims are reviewed manually and submission does not guarantee a
            mount. The claim promotion is not open yet.
          </p>
          <button
            type="button"
            onClick={() => openWebsite(PROMO_TERMS_URL)}
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-bold text-[#38BDF8] underline underline-offset-4"
          >
            Read eligibility and promotion terms
          </button>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5">
            <h2 className="text-sm font-bold text-[#38BDF8]">
              Location during active drives
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/65">
              When you record a drive, NJDrive50 uses location to capture the
              route and distance for that driving log. Location permission is
              requested before recording. You can stop the drive at any time.
            </p>
            <button
              type="button"
              onClick={() => setScreen("privacy")}
              className="mt-3 min-h-[44px] text-xs font-semibold text-[#38BDF8] underline underline-offset-4"
            >
              Read the Privacy Policy
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-xs text-white/60">
          <button
            type="button"
            onClick={() => setScreen("privacy")}
            className="min-h-[44px] underline underline-offset-2"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setScreen("terms")}
            className="min-h-[44px] underline underline-offset-2"
          >
            Terms of Service
          </button>
          <a
            href="mailto:support@njdrive50.com"
            className="inline-flex min-h-[44px] items-center"
          >
            Support
          </a>
        </div>
        <p className="mx-auto mt-3 max-w-lg text-[11px] leading-5 text-white/35">
          NJDrive50 is an organizational tool. It is not affiliated with NJMVC
          and does not determine licensing or road-test eligibility.
        </p>
        <p className="mt-3 text-[11px] text-white/25">
          © {new Date().getFullYear()} NJDrive50. All rights reserved.
        </p>
      </footer>
    </main>
  )
}