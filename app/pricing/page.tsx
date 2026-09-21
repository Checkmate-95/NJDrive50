"use client"

import Link from "next/link"
import { Preferences } from "@capacitor/preferences"

type FeatureRow = {
  label: string
  available: boolean
}

type Faq = {
  question: string
  answer: string
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}

export default function PricingPageClient({
  pricingFaqs,
}: {
  pricingFaqs: Faq[]
}) {
  const plannedFeatureRows: FeatureRow[] = [
    {
      label: "New Jersey supervised-driving log organization",
      available: true,
    },
    {
      label: "Daytime and nighttime progress organization",
      available: true,
    },
    {
      label: "Driving-progress dashboard for parents and teens",
      available: true,
    },
    {
      label: "Permit milestone organization",
      available: true,
    },
    {
      label: "Road-test planning support",
      available: true,
    },
    {
      label: "BA-CSD preparation support",
      available: true,
    },
  ]

  const enableTestMode =
    process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true"

  return (
    <div className="min-h-screen w-full bg-[#F7F9FC] text-[#08194A]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 pb-20 pt-4 sm:px-4 lg:px-6">
        <header className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
              >
                ← Back
              </Link>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
                Planned pricing
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Planned NJDrive50 subscription options
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                NJDrive50 is currently in Google Play review. The public Android
                app is not available for download yet. This page describes
                planned subscription options and planned premium features.
              </p>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-[#08194A]/55">
                When NJDrive50 becomes publicly available, final pricing, trial
                availability, billing frequency, renewal terms, cancellation
                options, and any applicable conditions will be shown before
                purchase through Google Play.
              </p>
            </div>

            <div className="flex w-full max-w-[280px] shrink-0 items-center gap-3 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#08194A] text-white">
                <ClockIcon />
              </span>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#08194A]/45">
                  App status
                </p>
                <p className="mt-1 text-sm font-bold text-[#08194A]">
                  In Google Play review
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          {enableTestMode && (
            <section className="rounded-[28px] border border-[#08194A]/10 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                    Tester access
                  </p>

                  <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                    Enter the app without billing
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
                    Development-only access for testing app functionality.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await Preferences.set({
                      key: "testMode",
                      value: "true",
                    })
                    window.location.reload()
                  }}
                  className="min-h-[48px] rounded-2xl bg-sky-400 px-6 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
                >
                  Continue in test mode
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-[28px] border border-[#08194A]/10 bg-white px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:px-6 sm:py-7">
              <div className="mb-4 inline-flex rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08194A]/70">
                Planned option
              </div>

              <h2 className="text-xl font-extrabold tracking-tight">Monthly</h2>

              <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
                A planned monthly subscription option for families who may
                prefer flexible billing.
              </p>

              <div className="mt-6">
                <span className="inline-flex rounded-full bg-[#F7F9FC] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#08194A]/72">
                  Final price shown before purchase
                </span>
              </div>

              <p className="mt-4 text-sm text-[#08194A]/62">
                Final monthly pricing, feature availability, billing details,
                and cancellation terms will be shown through Google Play if and
                when the public Android app becomes available.
              </p>

              <div className="mt-6 h-px w-full bg-[#08194A]/8" />

              <ul className="mt-6 space-y-3">
                {[
                  "Planned supervised-driving progress organization",
                  "Planned day and night driving record organization",
                  "Planned milestone and permit-timing tools",
                  "Planned road-test preparation support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF3FA] text-[#08194A]">
                      <CheckIcon />
                    </span>

                    <span className="text-sm leading-6 text-[#08194A]/72">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="relative overflow-hidden rounded-[28px] border border-[#08194A]/18 bg-[#08194A] px-5 py-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:px-6 sm:py-7">
              <div className="mb-4 inline-flex rounded-full bg-[#F9C80E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08194A]">
                Planned option
              </div>

              <h2 className="text-xl font-extrabold tracking-tight">Yearly</h2>

              <p className="mt-2 text-sm leading-6 text-white/72">
                A planned yearly subscription option for families who may prefer
                longer-term access during a permit and road-test timeline.
              </p>

              <div className="mt-6">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-white">
                  Final price shown before purchase
                </span>
              </div>

              <p className="mt-4 text-sm text-white/78">
                Final yearly pricing, feature availability, billing details,
                renewal terms, and cancellation options will be shown through
                Google Play if and when the public Android app becomes
                available.
              </p>

              <div className="mt-6 h-px w-full bg-white/10" />

              <ul className="mt-6 space-y-3">
                {[
                  "Planned driving-log organization tools",
                  "Planned parent-and-teen progress visibility",
                  "Planned permit milestone support",
                  "Planned BA-CSD preparation support",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/12 text-white">
                      <CheckIcon />
                    </span>

                    <span className="text-sm leading-6 text-white/78">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section
            id="subscription-details"
            className="rounded-[28px] border border-[#08194A]/10 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:px-6 sm:py-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                  Planned premium features
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  Features planned for NJDrive50
                </h2>
              </div>

              <p className="text-sm text-[#08194A]/55">
                Final availability will be shown in the Android app.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#08194A]/8">
              <div className="grid grid-cols-[minmax(0,1fr)_80px] bg-[#F7F9FC] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/55 sm:px-5">
                <div>Planned feature</div>
                <div className="text-center">Planned</div>
              </div>

              <div className="divide-y divide-[#08194A]/8">
                {plannedFeatureRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[minmax(0,1fr)_80px] items-center px-4 py-4 text-sm sm:px-5"
                  >
                    <div className="pr-4 font-medium text-[#08194A]">
                      {row.label}
                    </div>

                    <div className="flex justify-center">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#08194A] text-white"
                        aria-label="Planned"
                      >
                        <CheckIcon />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[28px] border border-[#08194A]/10 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:px-6 sm:py-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                FAQs
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                Common pricing questions
              </h2>

              <div className="mt-5 space-y-4">
                {pricingFaqs.map(({ question, answer }) => (
                  <div
                    key={question}
                    className="rounded-2xl bg-[#F7F9FC] px-4 py-4"
                  >
                    <h3 className="text-sm font-bold text-[#08194A]">
                      {question}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#08194A]/68">
                      {answer}
                    </p>
                  </div>
                ))}

                <div className="rounded-2xl bg-[#F7F9FC] px-4 py-4">
                  <h3 className="text-sm font-bold text-[#08194A]">
                    Is NJDrive50 publicly available today?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#08194A]/68">
                    No. NJDrive50 is currently in Google Play review. The public
                    Android listing is not available for download yet.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F9FC] px-4 py-4">
                  <h3 className="text-sm font-bold text-[#08194A]">
                    How will subscription management work?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#08194A]/68">
                    If subscriptions are offered after public release, purchase,
                    billing, renewal, cancellation, and subscription management
                    will be handled through Google Play. Final terms will be
                    shown before purchase.
                  </p>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-4 lg:self-start">
              <div className="rounded-[28px] border border-white/30 bg-[#08194A] px-5 py-6 text-white shadow-[0_16px_40px_rgba(8,25,74,0.22)]">
                <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/72">
                  App status
                </div>

                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                  Currently in Google Play review
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/72">
                  NJDrive50 is being prepared for Android. The public app is not
                  available for installation yet.
                </p>

                <div className="mt-5 rounded-2xl bg-white/8 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                    What happens after release
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/72">
                    Final subscription prices, trial availability, billing
                    frequency, renewal details, cancellation options, and
                    feature access will be presented through Google Play before
                    purchase.
                  </p>
                </div>

                <Link
                  href="/practice-test"
                  className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#F9C80E] px-5 py-3 text-sm font-extrabold text-[#08194A] shadow-sm transition hover:bg-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
                >
                  Try the NJ Practice Test
                </Link>

                <p className="mt-3 text-xs leading-5 text-white/56">
                  NJDrive50 is an organizational tool and is not affiliated with
                  NJMVC. Confirm current driving and licensing requirements
                  directly with NJMVC.
                </p>
              </div>
            </aside>
          </section>

          <section className="rounded-[28px] border border-[#08194A]/10 bg-[#08194A] px-4 py-5 text-white shadow-[0_8px_24px_rgba(8,25,74,0.14)] sm:px-6 sm:py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F9C80E]/80">
              Legal and account
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              Privacy, terms, and data controls
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Review the privacy policy and terms before using NJDrive50. You
              can also request account deletion or selected-data deletion from
              the links below.
            </p>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Link
                href="/privacy"
                className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/82 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-inset"
              >
                <span>Privacy Policy</span>
                <span className="text-white/35" aria-hidden="true">
                  ›
                </span>
              </Link>

              <div className="h-px w-full bg-white/10" />

              <Link
                href="/terms"
                className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/82 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-inset"
              >
                <span>Terms of Use</span>
                <span className="text-white/35" aria-hidden="true">
                  ›
                </span>
              </Link>

              <div className="h-px w-full bg-white/10" />

              <Link
                href="/delete-account"
                className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/82 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-inset"
              >
                <span>Delete Account</span>
                <span className="text-white/35" aria-hidden="true">
                  ›
                </span>
              </Link>

              <div className="h-px w-full bg-white/10" />

              <Link
                href="/delete-data"
                className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/82 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-inset"
              >
                <span>Delete My Data</span>
                <span className="text-white/35" aria-hidden="true">
                  ›
                </span>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}