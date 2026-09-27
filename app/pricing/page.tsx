import type { Metadata } from "next"
import Link from "next/link"

const PAGE_URL = "https://www.njdrive50.com/pricing"
const PAGE_TITLE = "Pricing | NJDrive50"
const PAGE_DESCRIPTION =
  "NJDrive50 subscription options: $4.99 per month, or a 7-day free trial then $29.99 per year, purchased through Google Play."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.njdrive50.app"
const GOOGLE_PLAY_MANAGE_URL = "https://play.google.com/store/account/subscriptions"
const GOOGLE_PLAY_BADGE_SRC = "/GetItOnGooglePlay_Badge_Web_color_English.svg"
const PROMO_TERMS_HREF = "/zyropro-promotion-terms"
const PROMO_CLAIM_HREF = "/claim-zyropro"

type FeatureRow = {
  label: string
  available: boolean
}

type Faq = {
  question: string
  answer: string
}

type PlanCardProps = {
  title: string
  badge?: string
  description: string
  price: string
  helperText: string
  trustText: string
  features: string[]
  featured?: boolean
}

const includedRows: FeatureRow[] = [
  { label: "New Jersey 50-hour driving log tracking", available: true },
  { label: "Automatic night-hours tracking", available: true },
  { label: "Progress dashboard for parents and teens", available: true },
  { label: "Road-test readiness support", available: true },
  { label: "Permit milestone reminders", available: true },
  { label: "BA-CSD preparation support", available: true },
]

const pricingFaqs: Faq[] = [
  {
    question: "Can I pay for NJDrive50 on this website?",
    answer:
      "No. This website does not process payments. Subscriptions are purchased, billed, and managed through Google Play inside the NJDrive50 Android app.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "The yearly plan includes a 7-day free trial. After the trial ends, $29.99 is billed for one year unless you cancel through Google Play before the trial ends.",
  },
  {
    question: "Does uninstalling the app cancel my subscription?",
    answer:
      "No. Uninstalling NJDrive50 does not cancel an active Google Play subscription. Manage or cancel your subscription through Google Play.",
  },
  {
    question: "Where do I manage or cancel my subscription?",
    answer:
      "You can manage, change, or cancel your subscription in your Google Play account subscription settings.",
  },
  {
    question: "How does the ZyroPro launch promotion work?",
    answer:
      "After your 7-day free trial ends and your $29.99 yearly payment successfully processes, submit a claim on the NJDrive50 website. The first 50 valid eligible claims received may receive one free ZyroPro dashboard mount. Monthly subscriptions are not eligible. Full rules are in the ZyroPro Promotion Terms.",
  },
]

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/delete-account", label: "Delete Account" },
  { href: "/delete-data/index.html", label: "Delete My Data" },
]

const googlePlayLinkBase =
  "group block w-full overflow-hidden rounded-2xl border text-left shadow-sm transition duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-offset-2"
const googlePlayLinkDark =
  "border-white/15 bg-white/[0.09] text-white hover:bg-white/[0.14] focus-visible:ring-offset-[#08194A]"
const googlePlayLinkLight =
  "border-[#08194A]/12 bg-white text-[#08194A] hover:border-[#08194A]/20 hover:shadow-md focus-visible:ring-offset-white"
const headerBadgeClasses =
  "inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
const promoPrimaryClasses =
  "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#F9C80E] px-5 py-3 text-sm font-extrabold text-[#08194A] shadow-sm transition hover:bg-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
const manageLinkClasses =
  "mt-4 inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
const legalLinkClasses =
  "flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white/82 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-inset"

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

function DownloadIcon() {
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
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function GooglePlayLink({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const linkClasses = `${googlePlayLinkBase} ${dark ? googlePlayLinkDark : googlePlayLinkLight} ${className}`

  return (
    <a href={GOOGLE_PLAY_URL} aria-label="Get NJDrive50 on Google Play" className={linkClasses}>
      <span className="flex min-h-[72px] items-center gap-3 px-4 py-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            dark ? "bg-[#F9C80E] text-[#08194A]" : "bg-[#08194A] text-white"
          }`}
        >
          <DownloadIcon />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold tracking-tight">
            Get NJDrive50 on Google Play
          </span>
          <span
            className={`mt-0.5 block text-xs leading-5 ${
              dark ? "text-white/68" : "text-[#08194A]/62"
            }`}
          >
            Choose monthly or yearly access securely inside the Android app
          </span>
        </span>

        <span
          className={`text-lg font-medium ${dark ? "text-white/60" : "text-[#08194A]/42"}`}
          aria-hidden="true"
        >
          ›
        </span>
      </span>

      <span
        className={`flex min-h-[58px] items-center justify-center border-t px-4 py-2.5 ${
          dark ? "border-white/10 bg-black/10" : "border-[#08194A]/8 bg-[#F7F9FC]"
        }`}
      >
        <img src={GOOGLE_PLAY_BADGE_SRC} alt="" className="h-auto w-[170px] max-w-full" />
      </span>
    </a>
  )
}

function PlanCard({
  title,
  badge,
  description,
  price,
  helperText,
  trustText,
  features,
  featured = false,
}: PlanCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border px-5 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:px-6 sm:py-7 ${
        featured
          ? "border-[#08194A]/18 bg-[#08194A] text-white"
          : "border-[#08194A]/10 bg-white text-[#08194A]"
      }`}
    >
      {badge ? (
        <div
          className={`mb-4 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] ${
            featured
              ? "bg-[#F9C80E] text-[#08194A]"
              : "border border-[#08194A]/10 bg-[#F7F9FC] text-[#08194A]/70"
          }`}
        >
          {badge}
        </div>
      ) : null}

      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>

      <p className={`mt-2 text-sm leading-6 ${featured ? "text-white/72" : "text-[#08194A]/65"}`}>
        {description}
      </p>

      <div className="mt-6">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] ${
            featured ? "bg-white/10 text-white" : "bg-[#F7F9FC] text-[#08194A]/72"
          }`}
        >
          {price}
        </span>
      </div>

      <p className={`mt-4 text-sm ${featured ? "text-white/78" : "text-[#08194A]/62"}`}>
        {helperText}
      </p>

      <p className={`mt-2 text-xs leading-5 ${featured ? "text-white/56" : "text-[#08194A]/50"}`}>
        {trustText}
      </p>

      <GooglePlayLink dark={featured} className="mt-6" />

      <div className={`mt-6 h-px w-full ${featured ? "bg-white/10" : "bg-[#08194A]/8"}`} />

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                featured ? "bg-white/12 text-white" : "bg-[#EEF3FA] text-[#08194A]"
              }`}
            >
              <CheckIcon />
            </span>
            <span className={`text-sm leading-6 ${featured ? "text-white/78" : "text-[#08194A]/72"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function PricingPage() {
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
                Pricing
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Simple NJDrive50 subscription options
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                Choose the NJDrive50 plan that fits your family&apos;s driving
                journey. Subscriptions are purchased securely through Google
                Play inside the NJDrive50 Android app.
              </p>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-[#08194A]/55">
                Monthly and yearly subscriptions renew automatically unless
                canceled through Google Play before the next billing date. A
                valid payment method may be required to begin a subscription or
                free trial.
              </p>
            </div>

            <div className="w-full max-w-[280px] shrink-0">
              <a href={GOOGLE_PLAY_URL} aria-label="Get NJDrive50 on Google Play" className={headerBadgeClasses}>
                <img src={GOOGLE_PLAY_BADGE_SRC} alt="" className="h-auto w-[180px]" />
              </a>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <PlanCard
              title="Monthly"
              badge="Flexible"
              description="Full NJDrive50 premium access with monthly billing through Google Play."
              price="$4.99 per month"
              helperText="A flexible option for families who need help tracking supervised driving progress month to month."
              trustText="Auto-renews every month unless canceled through Google Play before your next billing date. Not eligible for the ZyroPro launch promotion."
              features={[
                "Track supervised driving hours in New Jersey",
                "Monitor required night driving hours",
                "Use reminders and progress tools",
                "Stay organized for the NJ road test",
              ]}
            />

            <PlanCard
              title="Yearly"
              badge="Best value"
              description="Full NJDrive50 premium access with annual billing through Google Play."
              price="7-day free trial, then $29.99 per year"
              helperText="One year of premium support for less than $2.50 per month, billed annually after the free trial."
              trustText="After the 7-day free trial, $29.99 is billed and the plan auto-renews every year unless canceled through Google Play before the trial ends or before your next billing date."
              features={[
                "Everything in the monthly plan",
                "One year of driving-log access",
                "Parent-and-teen progress tracking tools",
                "Permit milestone and road-test readiness support",
              ]}
              featured
            />
          </section>

          <section className="overflow-hidden rounded-[28px] border border-[#38BDF8]/25 bg-[#08194A] text-white shadow-[0_16px_40px_rgba(8,25,74,0.22)]">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
              <div className="px-5 py-7 sm:px-7 sm:py-8">
                <div className="inline-flex rounded-full bg-[#F9C80E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08194A]">
                  Limited launch promotion
                </div>

                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Free ZyroPro dashboard mount for the first 50 valid eligible
                  claims received
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
                  Yearly NJDrive50 subscribers can claim one free ZyroPro
                  dashboard mount after the 7-day free trial ends and the $29.99
                  yearly payment successfully processes. The first 50 valid
                  eligible claims received qualify. Monthly subscriptions are
                  not eligible.
                </p>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                  NJDrive50 premium features are the primary value of the
                  yearly subscription. The ZyroPro mount is a limited launch
                  promotion offered and fulfilled by NJDrive50, not Google Play.
                  U.S. residents 18+ only. Promotion runs September 30, 2026
                  through March 31, 2027 or until 50 valid claims are received.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a href={GOOGLE_PLAY_URL} className={promoPrimaryClasses}>
                    Get yearly access on Google Play
                  </a>

                  <Link
                    href={PROMO_CLAIM_HREF}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
                  >
                    Already subscribed? Submit a claim
                  </Link>
                </div>

                <p className="mt-4 text-xs leading-5 text-white/56">
                  Submission does not guarantee qualification. See the{" "}
                  <Link
                    href={PROMO_TERMS_HREF}
                    className="font-semibold text-white underline underline-offset-2"
                  >
                    ZyroPro Promotion Terms
                  </Link>{" "}
                  for full eligibility, limits, and details.
                </p>
              </div>

              <div className="flex items-center justify-center bg-[#061121] p-5 sm:p-7">
                <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
                  <img
                    src="/zyropro.png"
                    alt="ZyroPro dashboard mount"
                    width={720}
                    height={405}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded-xl object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="subscription-details"
            className="rounded-[28px] border border-[#08194A]/10 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:px-6 sm:py-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                  Included with NJDrive50
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  Core premium features
                </h2>
              </div>

              <p className="text-sm text-[#08194A]/55">
                Available with an active NJDrive50 subscription.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-[#08194A]/8">
              <div className="grid grid-cols-[minmax(0,1fr)_80px] bg-[#F7F9FC] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/55 sm:px-5">
                <div>Feature</div>
                <div className="text-center">Included</div>
              </div>

              <div className="divide-y divide-[#08194A]/8">
                {includedRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[minmax(0,1fr)_80px] items-center px-4 py-4 text-sm sm:px-5"
                  >
                    <div className="pr-4 font-medium text-[#08194A]">{row.label}</div>
                    <div className="flex justify-center">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#08194A] text-white"
                        aria-label="Included"
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
      {(pricingFaqs ?? []).map(({ question, answer }) => (
        <div key={question} className="rounded-2xl bg-[#F7F9FC] px-4 py-4">
          <h3 className="text-sm font-bold text-[#08194A]">{question}</h3>
          <p className="mt-2 text-sm leading-6 text-[#08194A]/68">{answer}</p>
        </div>
      ))}
    </div>
  </div>

  <aside className="lg:sticky lg:top-4 lg:self-start">
    <div className="rounded-[28px] border border-white/30 bg-[#08194A] px-5 py-6 text-white shadow-[0_16px_40px_rgba(8,25,74,0.22)]">
      <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/72">
        App access
      </div>

      <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
        Get started in the Android app
      </h2>

      <p className="mt-3 text-sm leading-6 text-white/72">
        Install NJDrive50 from Google Play to choose a subscription
        plan, manage premium access, and track supervised driving
        progress.
      </p>

      <div className="mt-5 rounded-2xl bg-white/8 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
          Best value
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight">$29.99 / year</p>
        <p className="mt-1 text-sm text-white/62">
          Starts with a 7-day free trial. About $2.50 per month,
          billed annually. Monthly access is also available for
          $4.99/month.
        </p>
      </div>

      <GooglePlayLink dark className="mt-5" />

      <p className="mt-3 text-xs leading-5 text-white/56">
        Google Play handles subscription signup, billing, renewals,
        cancellations, and subscription management. Refund eligibility
        follows Google Play policies and applicable law.
      </p>

      <a
        href={GOOGLE_PLAY_MANAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={manageLinkClasses}
      >
        Manage subscription on Google Play
      </a>

      <p className="mt-3 text-xs leading-5 text-white/56">
        NJDrive50 is an organizational tool and is not affiliated with
        NJMVC.
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
              {legalLinks.map((link, index) => (
                <div key={link.href}>
                  {index > 0 ? <div className="h-px w-full bg-white/10" /> : null}
                  <a href={link.href} className={legalLinkClasses}>
                    <span>{link.label}</span>
                    <span className="text-white/35" aria-hidden="true">
                      ›
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}