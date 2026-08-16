"use client";

import Link from "next/link";
import { useNav } from "../../src/state/navStore";

type FeatureRow = {
  label: string;
  available: boolean;
};

type PlanCardProps = {
  title: string;
  badge?: string;
  description: string;
  price: string;
  helperText: string;
  trustText: string;
  features: string[];
  featured?: boolean;
  onSelect: () => void;
};

type GooglePlayButtonProps = {
  onClick: () => void;
  dark?: boolean;
  className?: string;
};

type Faq = {
  question: string;
  answer: string;
};

const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.njdrive50.app";

const GOOGLE_PLAY_MANAGE_URL =
  "https://play.google.com/store/account/subscriptions";

const GOOGLE_PLAY_BADGE_SRC =
  "/GetItOnGooglePlay_Badge_Web_color_English.svg";

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
  );
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
  );
}

function GooglePlayButton({
  onClick,
  dark = false,
  className = "",
}: GooglePlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Install NJDrive50 from Google Play"
      className={`group w-full overflow-hidden rounded-2xl border text-left shadow-sm transition duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-offset-2 ${
        dark
          ? "border-white/15 bg-white/[0.09] text-white hover:bg-white/[0.14] focus-visible:ring-offset-[#08194A]"
          : "border-[#08194A]/12 bg-white text-[#08194A] hover:border-[#08194A]/20 hover:shadow-md focus-visible:ring-offset-white"
      } ${className}`}
    >
      <span className="flex min-h-[72px] items-center gap-3 px-4 py-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            dark
              ? "bg-[#F9C80E] text-[#08194A]"
              : "bg-[#08194A] text-white"
          }`}
        >
          <DownloadIcon />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold tracking-tight">
            Install from Google Play
          </span>

          <span
            className={`mt-0.5 block text-xs leading-5 ${
              dark ? "text-white/68" : "text-[#08194A]/62"
            }`}
          >
            Start your 7-day free trial with Google Play in-app billing
          </span>
        </span>

        <span
          className={`text-lg font-medium ${
            dark ? "text-white/60" : "text-[#08194A]/42"
          }`}
          aria-hidden="true"
        >
          ›
        </span>
      </span>

      <span
        className={`flex min-h-[58px] items-center justify-center border-t px-4 py-2.5 ${
          dark
            ? "border-white/10 bg-black/10"
            : "border-[#08194A]/8 bg-[#F7F9FC]"
        }`}
      >
        <img
          src={GOOGLE_PLAY_BADGE_SRC}
          alt="Get it on Google Play"
          className="h-auto w-[170px] max-w-full"
        />
      </span>
    </button>
  );
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
  onSelect,
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

      <p
        className={`mt-2 text-sm leading-6 ${
          featured ? "text-white/72" : "text-[#08194A]/65"
        }`}
      >
        {description}
      </p>

      <div className="mt-6">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] ${
            featured
              ? "bg-white/10 text-white"
              : "bg-[#F7F9FC] text-[#08194A]/72"
          }`}
        >
          {price}
        </span>
      </div>

      <p
        className={`mt-4 text-sm ${
          featured ? "text-white/78" : "text-[#08194A]/62"
        }`}
      >
        {helperText}
      </p>

      <p
        className={`mt-2 text-xs leading-5 ${
          featured ? "text-white/56" : "text-[#08194A]/50"
        }`}
      >
        {trustText}
      </p>

      <GooglePlayButton onClick={onSelect} dark={featured} className="mt-6" />

      <div
        className={`mt-6 h-px w-full ${
          featured ? "bg-white/10" : "bg-[#08194A]/8"
        }`}
      />

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                featured
                  ? "bg-white/12 text-white"
                  : "bg-[#EEF3FA] text-[#08194A]"
              }`}
            >
              <CheckIcon />
            </span>

            <span
              className={`text-sm leading-6 ${
                featured ? "text-white/78" : "text-[#08194A]/72"
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function PricingPageClient({
  pricingFaqs,
}: {
  pricingFaqs: Faq[];
}) {
  const resetTo = useNav((s) => s.resetTo);

  const includedRows: FeatureRow[] = [
    { label: "New Jersey 50-hour driving log tracking", available: true },
    { label: "Automatic night-hours tracking", available: true },
    { label: "Progress dashboard for parents and teens", available: true },
    { label: "Road-test readiness support", available: true },
    { label: "Permit milestone reminders", available: true },
    { label: "BA-CSD preparation support", available: true },
  ];

  function handleGoToStore() {
    window.location.assign(GOOGLE_PLAY_URL);
  }

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
                NJDrive50 subscription options
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                Install NJDrive50 from Google Play and start with a 7-day free
                trial using Google Play in-app billing. After the trial, continue
                with monthly or yearly access.
              </p>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-[#08194A]/55">
                7-day free trial, then $4.99/month or $39.99/year. A valid
                payment method may be required to begin the trial. Subscriptions
                renew automatically each billing period unless canceled through
                Google Play before renewal or before the trial ends to avoid the
                next charge.
              </p>
            </div>

            <div className="w-full max-w-[280px] shrink-0">
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
                aria-label="Install NJDrive50 from Google Play"
              >
                <img
                  src={GOOGLE_PLAY_BADGE_SRC}
                  alt="Get it on Google Play"
                  className="h-auto w-[180px]"
                />
              </a>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          {process.env.NODE_ENV === "development" && (
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
                  onClick={() => resetTo("home")}
                  className="min-h-[48px] rounded-2xl bg-sky-400 px-6 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
                >
                  Continue in test mode
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <PlanCard
              title="Monthly"
              badge="Flexible"
              description="Full NJDrive50 access with a 7-day free trial, then monthly billing through Google Play."
              price="$4.99 per month"
              helperText="Start free for 7 days. Cancel through Google Play before the trial ends to avoid the first monthly charge."
              trustText="Auto-renews every month unless canceled in Google Play. A valid payment method may be required to start the trial."
              features={[
                "Track supervised driving hours in New Jersey",
                "Monitor required night driving hours",
                "Use reminders and progress tools",
                "Stay organized for the NJ road test",
              ]}
              onSelect={handleGoToStore}
            />

            <PlanCard
              title="Yearly"
              badge="Best value"
              description="Full NJDrive50 access with a 7-day free trial, then yearly billing through Google Play."
              price="$39.99 per year"
              helperText="Start free for 7 days. Cancel through Google Play before the trial ends to avoid the first yearly charge."
              trustText="Auto-renews every year unless canceled in Google Play. A valid payment method may be required to start the trial."
              features={[
                "Everything in the monthly plan",
                "One year of driving-log access",
                "Parent-and-teen progress tracking tools",
                "Permit milestone and road-test readiness support",
              ]}
              featured
              onSelect={handleGoToStore}
            />
          </section>

          <section className="rounded-[28px] border border-[#08194A]/10 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:px-6 sm:py-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                  Included with NJDrive50
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  Core app features
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
                    <div className="pr-4 font-medium text-[#08194A]">
                      {row.label}
                    </div>

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
                    How do I avoid being charged after the free trial?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#08194A]/68">
                    Cancel the subscription in Google Play before the 7-day trial
                    ends. If you do not cancel before the trial ends, the first
                    billing period begins automatically.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F9FC] px-4 py-4">
                  <h3 className="text-sm font-bold text-[#08194A]">
                    Does uninstalling the app cancel my subscription?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#08194A]/68">
                    No. Uninstalling NJDrive50 does not cancel an active Google
                    Play subscription. Manage or cancel subscriptions in Google
                    Play.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F9FC] px-4 py-4">
                  <h3 className="text-sm font-bold text-[#08194A]">
                    Where do I manage or cancel my subscription?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#08194A]/68">
                    You can manage or cancel your subscription through your
                    Google Play account subscription settings.
                  </p>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-4 lg:self-start">
              <div className="rounded-[28px] border border-white/30 bg-[#08194A] px-5 py-6 text-white shadow-[0_16px_40px_rgba(8,25,74,0.22)]">
                <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/72">
                  App access
                </div>

                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                  Install and start your free trial
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/72">
                  Install NJDrive50 from Google Play and start your 7-day free
                  trial using Google Play in-app billing. A valid payment method
                  may be required to begin the trial.
                </p>

                <div className="mt-5 rounded-2xl bg-white/8 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                    Subscription options
                  </p>

                  <p className="mt-2 text-2xl font-extrabold tracking-tight">
                    From $4.99 / month
                  </p>

                  <p className="mt-1 text-sm text-white/62">
                    Or $39.99 / year after a 7-day free trial. Uninstalling the
                    app does not cancel your subscription.
                  </p>
                </div>

                <GooglePlayButton
                  onClick={handleGoToStore}
                  dark
                  className="mt-5"
                />

                <p className="mt-3 text-xs leading-5 text-white/56">
                  Google Play handles subscription signup, billing, renewals,
                  cancellations, and subscription management for NJDrive50.
                  Refund eligibility follows Google Play policies and applicable
                  law.
                </p>

                <a
                  href={GOOGLE_PLAY_MANAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9C80E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
                >
                  Manage subscription on Google Play
                </a>
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
                href="/delete-my-data"
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
  );
}