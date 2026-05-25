import { Helmet } from "react-helmet-async"
import { useNav } from "../state/navStore"
import { useMemo, useState } from "react"

type BillingCycle = "monthly" | "yearly"

type FeatureRow = {
  label: string
  monthly: boolean
  yearly: boolean
}

type Plan = {
  billingCycle: BillingCycle
  name: string
  badge?: string
  description: string
  price: string
  priceSuffix: string
  helperText: string
  trustText: string
  features: string[]
  cta: string
  featured?: boolean
}

type PlanCardProps = Plan & {
  onSelect: () => void
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

function PlanCard({
  name,
  badge,
  description,
  price,
  priceSuffix,
  helperText,
  trustText,
  features,
  cta,
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

      <h2 className="text-xl font-extrabold tracking-tight">{name}</h2>

      <p
        className={`mt-2 text-sm leading-6 ${
          featured ? "text-white/72" : "text-[#08194A]/65"
        }`}
      >
        {description}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-4xl font-extrabold tracking-tight">{price}</span>
        <span
          className={`pb-1 text-sm ${
            featured ? "text-white/60" : "text-[#08194A]/55"
          }`}
        >
          {priceSuffix}
        </span>
      </div>

      <p className={`mt-2 text-sm ${featured ? "text-white/78" : "text-[#08194A]/62"}`}>
        {helperText}
      </p>

      <p
        className={`mt-2 text-xs leading-5 ${
          featured ? "text-white/56" : "text-[#08194A]/50"
        }`}
      >
        {trustText}
      </p>

      <button
        type="button"
        onClick={onSelect}
        aria-label={`${cta} for the ${name} plan`}
        className={`mt-6 min-h-[50px] w-full rounded-2xl px-5 py-3 text-sm font-extrabold transition ${
          featured
            ? "bg-[#F9C80E] text-[#08194A] hover:-translate-y-[1px] hover:bg-[#FFD84A]"
            : "border border-[#08194A]/12 bg-[#08194A] text-white hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
        }`}
      >
        {cta}
      </button>

      <div className={`mt-6 h-px w-full ${featured ? "bg-white/10" : "bg-[#08194A]/8"}`} />

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                featured ? "bg-white/12 text-white" : "bg-[#EEF3FA] text-[#08194A]"
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
  )
}

export default function PricingPage() {
  const setScreen = useNav((s) => s.setScreen)
  const [billing, setBilling] = useState<BillingCycle>("yearly")

  const PAGE_URL = "https://njdrive50.com/pricing"

  const metaTitle =
    "NJDrive50 Pricing | New Jersey Driving Log App Free Trial, Monthly & Annual Plans"
  const metaDescription =
    "See NJDrive50 pricing for New Jersey families. Start a 7-day free trial, then choose monthly or annual billing to track the NJ 50-hour driving log, night hours, permit milestones, and road test readiness."

  const monthlyPrice = 4.99
  const yearlyPrice = 39.99

  const yearlyMonthlyEquivalent = (yearlyPrice / 12).toFixed(2)
  const yearlySavings = (monthlyPrice * 12 - yearlyPrice).toFixed(2)

  const comparisonRows: FeatureRow[] = [
    { label: "7-day free trial", monthly: true, yearly: true },
    { label: "New Jersey 50-hour driving log tracking", monthly: true, yearly: true },
    { label: "Automatic night-hours tracking", monthly: true, yearly: true },
    { label: "Progress dashboard for parents and teens", monthly: true, yearly: true },
    { label: "Road test readiness support", monthly: true, yearly: true },
    { label: "Permit milestone reminders", monthly: true, yearly: true },
    { label: "BA-CSD prep support", monthly: true, yearly: true },
    { label: "Cancel anytime", monthly: true, yearly: false },
    { label: "Cancel before yearly renewal", monthly: false, yearly: true },
  ]

  const pricingFaqs = [
    {
      question: "Does the free trial apply to both plans?",
      answer:
        "Yes. Families can start with a 7-day free trial before monthly or annual billing begins.",
    },
    {
      question: "Are there different features in each plan?",
      answer:
        "No. Monthly and annual include the same NJDrive50 features. The difference is only billing frequency and total cost.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes. Monthly plans can be canceled anytime. Annual plans can be canceled before the next renewal date.",
    },
    {
      question: "Which plan is best for most families?",
      answer:
        "Annual is usually the better value if your teen will use NJDrive50 throughout the full permit and road test timeline.",
    },
    {
      question: "Is NJDrive50 built for New Jersey driving requirements?",
      answer:
        "Yes. NJDrive50 is designed for New Jersey families who need to track the 50-hour supervised driving requirement, required night hours, permit milestones, and BA-CSD readiness.",
    },
  ]

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pricingFaqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  }

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metaTitle,
    url: PAGE_URL,
    description: metaDescription,
  }

  const handleStartTrial = (_cycle: BillingCycle) => {
    setScreen("checkout")
  }

  const primaryPlan: Plan =
    billing === "yearly"
      ? {
          billingCycle: "yearly",
          name: "Annual",
          badge: "Best Value",
          description:
            "Best for families using NJDrive50 throughout the full permit-to-road-test journey.",
          price: "$39.99",
          priceSuffix: "/ year",
          helperText: `7-day free trial, then $39.99/year. About $${yearlyMonthlyEquivalent}/month and save $${yearlySavings} vs monthly.`,
          trustText:
            "Cancel annual renewal anytime before your next billing date. Final billing terms should match your App Store or Play Store setup exactly.",
          features: [
            "Everything NJDrive50 offers in one annual subscription",
            "Ideal for the full New Jersey learner permit period",
            "Better overall value for families planning ahead",
            "Fewer renewals while your teen completes required practice",
          ],
          cta: "Start Annual Trial",
          featured: true,
        }
      : {
          billingCycle: "monthly",
          name: "Monthly",
          badge: "Most Flexible",
          description:
            "Best if you want a lower commitment while your teen begins supervised driving.",
          price: "$4.99",
          priceSuffix: "/ month",
          helperText: "7-day free trial, then $4.99/month. Cancel anytime.",
          trustText:
            "No long-term commitment. Final billing and cancellation terms should match your App Store or Play Store setup exactly.",
          features: [
            "Full NJDrive50 access with no feature limits",
            "Great for short-term flexibility",
            "Simple monthly renewal while building driving hours",
            "Easy option for families who want to start small",
          ],
          cta: "Start Monthly Trial",
          featured: true,
        }

  const secondaryPlan: Plan =
    billing === "yearly"
      ? {
          billingCycle: "monthly",
          name: "Monthly",
          badge: "Flexible",
          description:
            "Good for families who prefer lower upfront cost and month-to-month flexibility.",
          price: "$4.99",
          priceSuffix: "/ month",
          helperText: "7-day free trial, then $4.99/month. Cancel anytime.",
          trustText:
            "No long-term commitment. Final billing and cancellation terms should match your App Store or Play Store setup exactly.",
          features: [
            "Track all supervised driving hours in New Jersey",
            "Monitor required night driving hours",
            "Use reminders and progress tools",
            "Switch plans later if needed",
          ],
          cta: "Choose Monthly",
          featured: false,
        }
      : {
          billingCycle: "yearly",
          name: "Annual",
          badge: "Save More",
          description:
            "Lower total cost for families planning to use NJDrive50 through the full permit process.",
          price: "$39.99",
          priceSuffix: "/ year",
          helperText: `7-day free trial, then $39.99/year. About $${yearlyMonthlyEquivalent}/month.`,
          trustText:
            "Cancel annual renewal anytime before the next billing date. Final billing terms should match your App Store or Play Store setup exactly.",
          features: [
            "Lower total annual cost than paying monthly",
            "Best fit for the complete learner permit timeline",
            "No feature differences from monthly",
            "Designed for long-term family use",
          ],
          cta: "Choose Annual",
          featured: false,
        }

  const plans = useMemo(() => [secondaryPlan, primaryPlan], [secondaryPlan, primaryPlan])

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={PAGE_URL} />
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqPageSchema)}</script>
      </Helmet>

      <div className="min-h-screen w-full bg-[#F7F9FC] text-[#08194A]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 pb-20 pt-4 sm:px-4 lg:px-6">
          <header className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setScreen("landing")}
                  className="inline-flex items-center rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A]"
                >
                  ← Back
                </button>

                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
                  Pricing
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  NJDrive50 pricing for New Jersey families
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                  Start with a 7-day free trial, then choose the plan that fits your family.
                  NJDrive50 helps parents and teens track the New Jersey 50-hour driving log,
                  required night hours, permit milestones, and road test readiness in one place.
                </p>

                <p className="mt-3 text-sm font-medium text-[#08194A]/62">
                  Start free, choose monthly flexibility, or save more with annual billing.
                </p>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#08194A]/62">
                  Want to study first? Try the{" "}
                  <button
                    type="button"
                    onClick={() => setScreen("practice-test")}
                    className="font-semibold text-[#08194A] underline underline-offset-4"
                  >
                    free New Jersey permit practice test
                  </button>{" "}
                  before you pick a plan.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-1">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  aria-label="Switch pricing display to monthly billing"
                  aria-pressed={billing === "monthly"}
                  className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition ${
                    billing === "monthly"
                      ? "bg-white text-[#08194A] shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
                      : "text-[#08194A]/60 hover:text-[#08194A]"
                  }`}
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() => setBilling("yearly")}
                  aria-label="Switch pricing display to yearly billing"
                  aria-pressed={billing === "yearly"}
                  className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold transition ${
                    billing === "yearly"
                      ? "bg-[#08194A] text-white shadow-[0_10px_24px_rgba(8,25,74,0.18)]"
                      : "text-[#08194A]/60 hover:text-[#08194A]"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </header>

          <main className="mt-6 space-y-6">
            <section className="grid gap-6 lg:grid-cols-2">
              {plans.map((plan) => (
                <PlanCard
                  key={`${plan.billingCycle}-${plan.name}`}
                  {...plan}
                  onSelect={() => handleStartTrial(plan.billingCycle)}
                />
              ))}
            </section>

            <section className="rounded-[28px] border border-[#08194A]/10 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:px-6 sm:py-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                    Included with every plan
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">What you get</h2>
                </div>

                <p className="text-sm text-[#08194A]/55">
                  Same core New Jersey features. Choose the billing option that fits your family.
                </p>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-[#08194A]/8">
                <div className="grid grid-cols-[minmax(0,1.6fr)_120px_120px] bg-[#F7F9FC] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/55 sm:px-5">
                  <div>Feature</div>
                  <div className="text-center">Monthly</div>
                  <div className="text-center">Annual</div>
                </div>

                <div className="divide-y divide-[#08194A]/8">
                  {comparisonRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[minmax(0,1.6fr)_120px_120px] items-center px-4 py-4 text-sm sm:px-5"
                    >
                      <div className="pr-4 font-medium text-[#08194A]">{row.label}</div>

                      <div className="flex justify-center">
                        {row.monthly ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF3FA] text-[#08194A]">
                            <CheckIcon />
                          </span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#08194A]/30">
                            —
                          </span>
                        )}
                      </div>

                      <div className="flex justify-center">
                        {row.yearly ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#08194A] text-white">
                            <CheckIcon />
                          </span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#08194A]/30">
                            —
                          </span>
                        )}
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
                  Common billing questions
                </h2>

                <div className="mt-5 space-y-4">
                  {pricingFaqs.map(({ question, answer }) => (
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
                    Recommended
                  </div>

                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                    Choose annual and save
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/72">
                    $39.99 per year works out to about ${yearlyMonthlyEquivalent}/month, which saves
                    ${yearlySavings} compared with paying $4.99 monthly for 12 months.
                  </p>

                  <div className="mt-5 rounded-2xl bg-white/8 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                      Annual value
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight">$39.99/year</p>
                    <p className="mt-1 text-sm text-white/62">
                      Includes a 7-day free trial first for New Jersey families.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartTrial("yearly")}
                    aria-label="Start 7-day free trial with annual billing"
                    className="mt-5 min-h-[50px] w-full rounded-2xl bg-[#F9C80E] px-5 py-3 text-sm font-extrabold text-[#08194A] transition hover:-translate-y-[1px] hover:bg-[#FFD84A]"
                  >
                    Start 7-Day Free Trial
                  </button>

                  <p className="mt-3 text-xs leading-5 text-white/56">
                    7-day free trial. Cancel anytime for monthly plans, or cancel annual renewal
                    before your next billing date.
                  </p>
                </div>
              </aside>
            </section>
          </main>
        </div>
      </div>
    </>
  )
}