import Link from "next/link"

type Faq = {
  question: string
  answer: string
}

type LandingPageClientProps = {
  faqs: Faq[]
}

export default function LandingPageClient({
  faqs,
}: LandingPageClientProps) {
  const features = [
    {
      icon: "⏱️",
      title: "Track supervised driving progress",
      description:
        "Keep total driving practice organized in one place, so your family can see progress toward New Jersey's supervised-driving requirements.",
    },
    {
      icon: "🌙",
      title: "Keep day and night hours separate",
      description:
        "Organize daytime and nighttime driving progress so it is easier to see what practice time may still be needed.",
    },
    {
      icon: "📅",
      title: "Follow permit milestones",
      description:
        "Save a permit issue date and keep important driving-timeline milestones visible as your teen gets closer to road-test eligibility.",
    },
    {
      icon: "📝",
      title: "Organize practice-drive details",
      description:
        "Keep supervised practice-drive records together instead of relying on paper notes, text messages, or scattered spreadsheets.",
    },
    {
      icon: "🔔",
      title: "Stay on pace",
      description:
        "Use reminders and progress milestones to help your family keep driving practice from becoming a last-minute scramble.",
    },
    {
      icon: "📄",
      title: "Prepare for BA-CSD",
      description:
        "Maintain an organized driving record to help prepare the information needed for NJMVC Form BA-CSD.",
    },
  ]

  const steps = [
    {
      step: "01",
      title: "Create a driver profile",
      description:
        "Add the teen driver's name, birth date, and permit issue date to keep the driving timeline organized in one place.",
    },
    {
      step: "02",
      title: "Log supervised practice drives",
      description:
        "Record practice sessions and keep drive duration, dates, time-of-day details, and supervising-adult information organized.",
    },
    {
      step: "03",
      title: "Review progress before the road test",
      description:
        "Check supervised-driving totals, nighttime progress, permit milestones, and driving-log details whenever your family needs them.",
    },
  ]

  const plans = [
    {
      name: "Monthly",
      price: "$4.99",
      billing: "per month",
      highlight: "Flexible access",
      featured: false,
      features: [
        "Track supervised driving progress",
        "Keep daytime and nighttime hours organized",
        "Review permit timing and milestones",
        "Manage your driving log in the app",
      ],
    },
    {
      name: "Yearly",
      price: "$29.99",
      billing: "per year",
      highlight: "About $2.50 per month",
      featured: true,
      features: [
        "Full premium access for one year",
        "Track NJ supervised-driving progress",
        "Keep permit dates and milestones organized",
        "Maintain an organized driving-log record",
      ],
    },
  ]

  const ctaLinkClass =
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#38BDF8] px-6 py-3 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] transition hover:bg-[#0EA5E9] active:scale-[0.99] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"

  const secondaryLinkClass =
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/5 active:scale-[0.99] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"

  const navTextLinkClass =
    "rounded-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"

  const sectionLinkClass =
    "rounded-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"

  return (
    <div className="min-h-screen bg-[#020617] pb-24 text-white md:pb-0">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/njdrive50Logo6.png"
              alt="NJDrive50"
              className="h-12 w-auto shrink-0 object-contain sm:h-16"
            />

            <div className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-semibold tracking-[0.16em] text-[#38BDF8] sm:text-sm">
                NJDRIVE50
              </span>
              <span className="hidden text-[11px] font-medium text-white/60 sm:block">
                New Jersey Teen Driving Log App
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-5 text-xs font-semibold text-white/60 md:flex">
            <a href="#how-it-works" className={sectionLinkClass}>
              How it works
            </a>
            <a href="#features" className={sectionLinkClass}>
              Features
            </a>
            <a href="#pricing-preview" className={sectionLinkClass}>
              Plans
            </a>
            <a href="#faq" className={sectionLinkClass}>
              FAQ
            </a>

            <Link href="/practice-test" className={navTextLinkClass}>
              Practice Test
            </Link>

            <Link href="/login" className={navTextLinkClass}>
              Log in
            </Link>

            <a
              href="#availability"
              className="rounded-lg bg-[#38BDF8] px-4 py-1.5 text-xs font-bold text-[#020617] transition hover:bg-[#0EA5E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              App status
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 -top-32 flex justify-center">
            <div className="h-[420px] w-[420px] rounded-full bg-[#38BDF8]/5 blur-[120px] sm:h-[500px] sm:w-[700px]" />
          </div>

          <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:gap-10 sm:py-16 md:flex-row md:items-center md:justify-between md:gap-12 md:py-24">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                <span className="text-[10px] font-bold tracking-[0.14em] text-[#38BDF8] sm:text-[11px] sm:tracking-[0.18em]">
                  BUILT FOR NEW JERSEY PARENTS AND TEEN DRIVERS
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Keep your teen&apos;s{" "}
                <span className="text-[#38BDF8]">
                  NJ driving hours and road-test timeline
                </span>{" "}
                in one place
              </h1>

              <p className="mt-4 text-base leading-7 text-white/75 sm:mt-5">
                NJDrive50 is designed to help New Jersey families organize
                supervised driving practice, keep day and night driving progress
                visible, monitor permit milestones, and prepare for NJMVC Form
                BA-CSD.
              </p>

              <p className="mt-3 text-sm leading-6 text-white/55">
                A simpler way to organize driving-log details than paper notes,
                spreadsheets, and last-minute searching.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                {[
                  { value: "50", label: "Supervised hours to track" },
                  { value: "10", label: "Hours during darkness" },
                  { value: "6 mo", label: "Minimum permit wait" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="flex min-h-[72px] flex-col justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center"
                  >
                    <span className="text-xl font-extrabold text-[#38BDF8]">
                      {value}
                    </span>
                    <span className="text-[11px] text-white/55">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
                <a href="#availability" className={ctaLinkClass}>
                  View app status
                </a>

                <a href="#how-it-works" className={secondaryLinkClass}>
                  See how it works
                </a>

                <Link href="/practice-test" className={secondaryLinkClass}>
                  Try the NJ Practice Test
                </Link>
              </div>

              <p className="mt-4 max-w-xl text-xs leading-6 text-white/45">
                NJDrive50 is an organizational tool. It is not affiliated with
                the New Jersey Motor Vehicle Commission and does not determine
                licensing or road-test eligibility.
              </p>
            </div>

            <div className="flex w-full flex-1 justify-center md:justify-end">
              <div className="w-full max-w-[250px] sm:max-w-[280px] md:max-w-[300px]">
                <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-b from-[#0F172A] to-[#020617] shadow-[0_30px_70px_rgba(15,23,42,0.72)]">
                  <div className="flex flex-col gap-2.5 p-3.5 sm:p-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
                      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
                        Supervised Hours
                      </p>

                      <p className="mt-1 text-[22px] font-extrabold tabular-nums tracking-tight text-[#38BDF8] sm:text-[28px]">
                        32.5
                      </p>

                      <p className="mt-1 text-[10px] text-white/50">
                        17.5 hours remaining
                      </p>

                      <div className="mt-2.5">
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                          role="progressbar"
                          aria-label="Supervised driving hours progress"
                          aria-valuemin={0}
                          aria-valuemax={50}
                          aria-valuenow={32.5}
                          aria-valuetext="32.5 of 50 supervised driving hours completed"
                        >
                          <div
                            className="h-full rounded-full bg-[#38BDF8]"
                            style={{ width: "65%" }}
                          />
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[9px] text-white/45 sm:text-[10px]">
                          <span>65% complete</span>
                          <span>Goal: 50 hours</span>
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
                        <p className="mt-1 text-sm font-bold leading-none text-white">
                          47 days
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
                          Estimated
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                        <p className="text-[9px] uppercase tracking-[0.14em] text-white/45 sm:text-[10px]">
                          Night left
                        </p>
                        <p className="mt-1 text-sm font-bold tabular-nums text-yellow-400">
                          4.0 hrs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-center text-[11px] leading-5 text-white/40">
                  Example dashboard preview. All displayed progress is sample
                  data.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="availability"
          className="scroll-mt-24 border-b border-[#38BDF8]/20 bg-[#38BDF8]/5"
        >
          <div className="mx-auto max-w-5xl px-4 py-5 sm:py-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#38BDF8]/20 bg-[#020617]/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-bold text-white">
                  NJDrive50 is currently in Google Play review
                </p>
                <p className="mt-1 text-sm leading-6 text-white/60">
                  The public Android app is not available for download yet. This
                  page describes NJDrive50 and the features planned for release.
                </p>
              </div>

              <Link
                href="/practice-test"
                className={`${secondaryLinkClass} sm:shrink-0`}
              >
                Try the NJ Practice Test
              </Link>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-b border-white/10 bg-white/[0.02]"
        >
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                How it works
              </p>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                From permit day to a more organized road-test plan
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/65">
                NJDrive50 is designed to keep the driving-log details your
                family needs in one clear place.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(({ step, title, description }) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                >
                  <div className="text-xs font-extrabold tracking-[0.22em] text-[#38BDF8]">
                    STEP {step}
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-white">{title}</h3>

                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Free NJ Practice Test
                </h3>

                <p className="mt-2 text-sm leading-7 text-white/65">
                  Help your teen prepare for the New Jersey knowledge exam with
                  practice questions before permit day.
                </p>
              </div>

              <Link
                href="/practice-test"
                className={`${ctaLinkClass} sm:shrink-0`}
              >
                Start Practice Test
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 border-b border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                Features
              </p>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Built for details a basic spreadsheet can miss
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/65">
                Keep driving progress, permit timing, and driving-log
                organization together instead of trying to reconstruct them at
                the last minute.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                >
                  <div className="text-2xl" aria-hidden="true">
                    {icon}
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>

                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing-preview"
          className="scroll-mt-24 border-b border-white/10 bg-white/[0.02]"
        >
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                Plans
              </p>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Straightforward subscription options
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/65">
                Planned subscriptions will be offered through Google Play in the
                Android app. This website does not process payments.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-6 ${
                    plan.featured
                      ? "border-[#38BDF8]/30 bg-[#38BDF8]/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#38BDF8]">
                        {plan.name}
                      </p>

                      <h3 className="mt-2 text-3xl font-extrabold text-white">
                        {plan.price}
                      </h3>

                      <p className="mt-1 text-sm text-white/55">
                        {plan.billing}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#38BDF8]">
                      {plan.highlight}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm leading-7 text-white/72">
                    {plan.features.map((item) => (
                      <li
                        key={item}
                        className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/65 sm:p-6">
              <p>
                If and when subscriptions become available, Google Play will
                display the final price, billing period, renewal information,
                cancellation options, and any applicable terms before purchase.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a href="#availability" className={ctaLinkClass}>
                View app status
              </a>

              <Link href="/pricing" className={secondaryLinkClass}>
                View pricing details
              </Link>
            </div>
          </div>
        </section>

        <section
          id="nj-requirements"
          className="scroll-mt-24 border-b border-white/10 bg-[#38BDF8]/5"
        >
          <div className="mx-auto max-w-5xl px-4 py-12">
            <div className="flex flex-col gap-5 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5 sm:flex-row sm:items-start sm:p-6">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-xl"
                aria-hidden="true"
              >
                📋
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#38BDF8]">
                  New Jersey teen-driving requirements
                </h2>

                <p className="mt-3 text-base leading-7 text-white/72">
                  For drivers under 21 with eligible permits issued on or after
                  February 1, 2025, New Jersey requires 50 hours of supervised
                  driving, including 10 hours during darkness, before a
                  probationary license can be issued.
                </p>

                <p className="mt-3 text-base leading-7 text-white/72">
                  Drivers must also meet the applicable permit waiting period
                  and bring required documentation when applying for licensure.
                  Requirements can change, so confirm your teen&apos;s current
                  eligibility directly with NJMVC.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-sm font-bold text-white">
                      What NJDrive50 is designed to organize
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-white/65">
                      Supervised-driving progress, day and night records, permit
                      dates, milestones, and BA-CSD preparation.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-sm font-bold text-white">
                      What to confirm with NJMVC
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-white/65">
                      Current eligibility rules, road-test requirements,
                      documents, appointments, and final licensing decisions.
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.nj.gov/mvc/license/youngadult.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-sm text-sm font-semibold text-[#38BDF8] underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/60"
                >
                  Read official NJMVC requirements
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                Road-test checklist
              </p>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Keep these items on your family&apos;s radar
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-white/65">
                This is a planning checklist, not an official eligibility
                determination. Confirm all current requirements with NJMVC.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Keep a valid New Jersey learner or examination permit.",
                "Track supervised practice toward the applicable hour requirement.",
                "Keep nighttime driving progress organized.",
                "Monitor the applicable waiting period from the permit issue date.",
                "Prepare required BA-CSD documentation when appropriate.",
                "Review NJMVC road-test requirements before the appointment.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/72"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-b border-white/10">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
            <div className="mb-10 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                FAQ
              </p>

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Common NJDrive50 questions
              </h2>

              <p className="mx-auto mt-3 max-w-md text-base leading-7 text-white/65">
                Quick answers about driving-log organization, New Jersey permit
                planning, planned subscriptions, and app availability.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map(({ question, answer }) => (
                <details
                  key={question}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] open:border-[#38BDF8]/20 open:bg-white/[0.05] [&>summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex min-h-[52px] cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#38BDF8]/60">
                    <span>{question}</span>
                    <span
                      className="mt-0.5 shrink-0 text-[#38BDF8] transition group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>

                  <div className="px-5 pb-5 pt-0 text-sm leading-7 text-white/65">
                    {answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
              Get started
            </p>

            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              A clearer way to organize NJ supervised-driving progress
            </h2>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-white/65">
              Explore NJDrive50, use the free practice test, and check back for
              public Android app availability.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-center">
              <a href="#availability" className={ctaLinkClass}>
                View app status
              </a>

              <Link href="/practice-test" className={secondaryLinkClass}>
                Try the NJ Practice Test
              </Link>

              <Link href="/pricing" className={secondaryLinkClass}>
                View planned pricing
              </Link>
            </div>

            <p className="mx-auto mt-4 max-w-lg text-xs leading-6 text-white/45">
              NJDrive50 does not process payments through this website, does not
              determine NJMVC licensing eligibility, and is not affiliated with
              the New Jersey Motor Vehicle Commission.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/40">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/njdrive50Logo6.png"
                alt="NJDrive50"
                className="h-10 w-auto object-contain"
              />

              <span className="text-sm font-bold tracking-[0.16em] text-[#38BDF8]">
                NJDRIVE50
              </span>
            </div>

            <p className="mt-2 max-w-[32ch] text-xs leading-6 text-white/40">
              A New Jersey driving-log organizer for parents and teens tracking
              supervised practice, nighttime progress, and permit milestones.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-white/40">
            <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">
              Legal
            </p>

            <Link
              href="/privacy"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Terms of Use
            </Link>

            <Link
              href="/delete-account"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Delete Account
            </Link>

            <Link
              href="/delete-data"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Delete My Data
            </Link>
          </div>

          <div className="flex flex-col gap-2 text-sm text-white/40">
            <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">
              Account
            </p>

            <Link
              href="/settings"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Settings
            </Link>

            <Link
              href="/pricing"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Pricing Details
            </Link>

            <Link
              href="/login"
              className="min-h-[44px] py-1 text-left hover:text-white/70"
            >
              Log in
            </Link>
          </div>

          <div className="flex flex-col gap-2 text-sm text-white/40">
            <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">
              Resources
            </p>

            <a
              href="https://www.nj.gov/mvc/license/youngadult.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] py-1 hover:text-white/70"
            >
              NJMVC First License Info
            </a>

            <a
              href="https://www.nj.gov/mvc/license/roadtest.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] py-1 hover:text-white/70"
            >
              NJMVC Road Test Info
            </a>

            <a
              href="https://www.nj.gov/mvc/pdf/license/BA-CSD.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] py-1 hover:text-white/70"
            >
              NJMVC Form BA-CSD
            </a>

            <Link
              href="/practice-test"
              className="min-h-[44px] py-1 hover:text-white/70"
            >
              NJ Practice Test
            </Link>
          </div>

          <div className="flex flex-col gap-2 text-sm text-white/40">
            <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">
              Contact
            </p>

            <a
              href="mailto:support@njdrive50.com"
              className="min-h-[44px] py-1 hover:text-white/70"
            >
              support@njdrive50.com
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 px-4 py-4 text-center text-[11px] text-white/25">
          © {new Date().getFullYear()} NJDrive50. All rights reserved. NJDrive50
          is not affiliated with the New Jersey Motor Vehicle Commission.
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#020617]/95 p-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <a
            href="#availability"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[#38BDF8] px-5 py-3 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
          >
            App status
          </a>

          <Link
            href="/login"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}