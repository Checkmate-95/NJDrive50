import type { Metadata } from "next"
import Link from "next/link"

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.njdrive50.app"
const MANAGE_URL = "https://play.google.com/store/account/subscriptions"
const TERMS_URL = "/zyropro-promotion-terms"
const CLAIM_URL = "/claim-zyropro"

// Set this in Vercel Production only after the subscription update and the
// app's install price have been checked in Play Console, then redeploy.
const BILLING_LIVE = process.env.NJDRIVE50_BILLING_LIVE === "true"

// The claim API must use the same ZYROPRO_PROMO_OPEN setting.
// Redeploy after changing it.
const PROMO_OPEN =
  BILLING_LIVE && process.env.ZYROPRO_PROMO_OPEN === "true"

export const metadata: Metadata = {
  title: "Pricing | NJDrive50",
  description:
    "NJDrive50 plans: $4.99 monthly or $29.99 yearly through Google Play. Eligible new subscribers may receive a 7-day trial. See yearly launch promotion terms.",
  alternates: { canonical: "https://www.njdrive50.com/pricing" },
}

const plans = [
  {
    name: "Monthly",
    price: "$4.99",
    period: "per month",
    badge: "Flexible",
    featured: false,
    details:
      "Eligible new subscribers may receive a 7-day free trial. If offered, $4.99 is billed when the trial ends unless you cancel first. Renews monthly until canceled through Google Play.",
    features: [
      "Track supervised driving hours",
      "Keep day and night hours organized",
      "Review permit milestones",
      "Manage your driving log",
    ],
  },
  {
    name: "Yearly",
    price: "$29.99",
    period: "per year",
    badge: "Best value",
    featured: true,
    details:
      "Eligible new subscribers may receive a 7-day free trial. If offered, $29.99 is billed when the trial ends unless you cancel first. Renews yearly until canceled through Google Play.",
    features: [
      "Everything in the monthly plan",
      "One year of premium access",
      "Parent and teen progress tools",
      "Eligible for the limited ZyroPro promotion",
    ],
  },
]

const faqs = [
  {
    question: "Can I pay on this website?",
    answer:
      "No. Subscriptions are purchased and managed through Google Play inside the Android app. Google Play shows the final price and any eligible offer before you subscribe.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Eligible new subscribers may receive a 7-day free trial on either plan. Availability depends on the offer shown to your Google Play account. Cancel before an applicable trial ends to avoid the first subscription charge.",
  },
  {
    question: "Does uninstalling cancel my subscription?",
    answer:
      "No. Manage or cancel your subscription in Google Play. Uninstalling the app does not cancel billing.",
  },
  {
    question: "How does the ZyroPro promotion work?",
    answer:
      "After an applicable trial ends and the first $29.99 yearly payment succeeds, an eligible subscriber may submit a claim. NJDrive50 manually reviews claims. The first 50 valid eligible claims qualify; submitting a claim does not guarantee a mount. Monthly subscribers do not qualify. Read the full promotion terms for dates and limits.",
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-6 text-[#08194A] sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.07)] sm:p-7">
          <Link
            href="/"
            className="text-sm font-bold underline underline-offset-4"
          >
            ← Back to NJDrive50
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
            Pricing
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Simple NJDrive50 subscription options
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#08194A]/70 sm:text-base">
            Choose monthly or yearly premium access in the Android app. Google
            Play handles subscriptions, renewals, and cancellations. This website
            does not process payments.
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-6 text-[#08194A]/60">
            Eligible new subscribers may receive a 7-day free trial on either
            plan. Google Play shows your eligible offer and billing terms before
            you subscribe.
          </p>
        </header>

        {!BILLING_LIVE && (
          <div className="rounded-2xl border border-[#38BDF8]/30 bg-[#EAF8FF] px-5 py-4 text-sm leading-6">
            <strong>Subscription update approved; launch pending.</strong> The
            plans below describe the upcoming subscription options. Check back
            when the update is released for purchase through Google Play.
          </div>
        )}

        <section
          aria-label="Subscription plans"
          className="grid gap-5 lg:grid-cols-2"
        >
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[28px] border p-6 shadow-[0_16px_40px_rgba(8,25,74,0.09)] ${
                plan.featured
                  ? "border-[#08194A] bg-[#08194A] text-white"
                  : "border-[#08194A]/10 bg-white"
              }`}
            >
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${
                  plan.featured
                    ? "bg-[#F9C80E] text-[#08194A]"
                    : "bg-[#EEF3FA] text-[#08194A]"
                }`}
              >
                {plan.badge}
              </span>
              <h2 className="mt-4 text-2xl font-extrabold">{plan.name}</h2>
              <p className="mt-3 text-4xl font-extrabold">
                {plan.price}{" "}
                <span className="text-sm font-medium opacity-70">
                  {plan.period}
                </span>
              </p>
              <p className="mt-4 text-sm leading-6 opacity-75">
                {plan.details}
              </p>
              {plan.name === "Monthly" && (
                <p className="mt-2 text-xs font-semibold opacity-70">
                  Monthly plans do not qualify for the ZyroPro promotion.
                </p>
              )}
              <ul className="mt-6 space-y-3 border-t border-current/10 pt-5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span aria-hidden="true">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {BILLING_LIVE && (
                <a
                  href={PLAY_URL}
                  className={`mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-extrabold ${
                    plan.featured
                      ? "bg-[#F9C80E] text-[#08194A]"
                      : "bg-[#08194A] text-white"
                  }`}
                >
                  Get NJDrive50 on Google Play
                </a>
              )}
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-[28px] bg-[#08194A] text-white shadow-[0_16px_40px_rgba(8,25,74,0.2)]">
          <div className="p-6 sm:p-8">
            <p
              role="status"
              aria-live="polite"
              aria-label={`Yearly launch promotion status: ${PROMO_OPEN ? "Open" : "Coming soon"}`}
              className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#F9C80E]"
            >
              Yearly launch promotion · {PROMO_OPEN ? "Open" : "Coming soon"}
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-[#F9C80E] sm:text-3xl">
              A chance to claim a free ZyroPro dashboard mount
            </h2>
            <p className="mt-2 text-xs text-white/55">
              Updated September 2026
            </p>
            <p className="mt-4 text-sm leading-7 text-white/75">
              The first 50 valid eligible claims from yearly subscribers qualify
              after an applicable free trial ends and the first $29.99 yearly
              payment succeeds. Monthly subscriptions do not qualify.
            </p>
            <p className="mt-3 text-xs leading-6 text-white/60">
              U.S. residents 18+ only. One per eligible order and household.
              Claims are reviewed manually. Submission does not guarantee a
              mount. NJDrive50 offers and fulfills the promotion, not Google
              Play. See the terms for dates and complete eligibility rules.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={TERMS_URL}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#F9C80E] px-5 py-3 text-sm font-extrabold text-[#08194A]"
              >
                Read promotion terms
              </Link>
              {PROMO_OPEN && (
                <Link
                  href={CLAIM_URL}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white"
                >
                  Submit your claim
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[28px] bg-white p-6">
            <h2 className="text-2xl font-extrabold">
              Common pricing questions
            </h2>
            <div className="mt-5 space-y-5">
              {faqs.map(({ question, answer }) => (
                <div key={question} className="rounded-xl bg-[#F7F9FC] p-4">
                  <h3 className="font-bold">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#08194A]/70">
                    {answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <aside className="self-start rounded-[28px] bg-[#08194A] p-6 text-white lg:sticky lg:top-4">
            <h2 className="text-xl font-extrabold">Manage your plan</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Google Play handles subscription signup, billing, renewals, and
              cancellation. Uninstalling the app does not cancel a subscription.
            </p>
            <a
              href={MANAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[44px] items-center text-sm font-bold text-[#F9C80E] underline underline-offset-4"
            >
              Manage subscription on Google Play
            </a>
          </aside>
        </section>

        <footer className="rounded-[28px] bg-[#08194A] p-6 text-white">
          <h2 className="text-xl font-extrabold">Legal and data controls</h2>
          <p className="mt-2 text-sm text-white/65">
            Review the terms and privacy policy, or request deletion of your
            account or selected data.
          </p>
          <nav
            aria-label="Legal and account links"
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Use" },
              { href: "/delete-account", label: "Delete Account" },
              { href: "/delete-data", label: "Delete My Data" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
              >
                {link.label} →
              </Link>
            ))}
          </nav>
          <p className="mt-5 text-xs text-white/55">
            NJDrive50 is an organizational tool and is not affiliated with NJMVC.
          </p>
        </footer>
      </div>
    </main>
  )
}