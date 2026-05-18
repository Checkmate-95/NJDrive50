import { Helmet } from "react-helmet-async"

export default function LandingPage() {
  const faqs = [
    {
      question: "How many supervised driving hours are required for a NJ learner permit?",
      answer:
        "As of February 1, 2025, New Jersey requires all permit holders under 21 to complete a minimum of 50 hours of supervised driving — including at least 10 hours at night — before they can apply for a probationary driver license.",
    },
    {
      question: "Who can supervise a teen driver in New Jersey?",
      answer:
        "A parent, guardian, or any licensed driver over the age of 21 who has held their NJ driver's license for at least three years. A certified driving school instructor also qualifies.",
    },
    {
      question: "Do I have to submit my driving log to the NJ MVC?",
      answer:
        "No. The NJ MVC does not require you to submit your driving log. However, you must submit a signed Certification of Supervised Driving (NJMVC Form BA-CSD) when applying for your probationary license. NJDrive50 helps you keep an accurate log so that certification is easy to complete.",
    },
    {
      question: "How long is a New Jersey learner permit valid?",
      answer:
        "A New Jersey learner's permit (special learner's permit or examination permit) is valid for 2 years from the issue date. You must also wait at least 6 months after your permit issue date before you can take your road test.",
    },
    {
      question: "Does NJDrive50 work on Android?",
      answer:
        "Yes. NJDrive50 is built for Android and is designed specifically for NJ families tracking supervised driving hours toward the NJ MVC 50-hour requirement.",
    },
    {
      question: "Is NJDrive50 free?",
      answer: "Yes. NJDrive50 is completely free for all New Jersey families.",
    },
  ]

  const features = [
    {
      icon: "🕐",
      title: "Day & Night Hour Tracking",
      description:
        "Automatically separates your daytime and nighttime hours so you always know exactly how many of the required 10 night hours remain.",
    },
    {
      icon: "📍",
      title: "GPS Drive Logging",
      description:
        "Log each supervised drive with GPS route data, start/end time, and distance so your records are always accurate and dispute-proof.",
    },
    {
      icon: "📋",
      title: "Permit Countdown Timer",
      description:
        "NJDrive50 tracks your permit issue date and shows a live countdown to your permit expiration and your 6-month road test eligibility date.",
    },
    {
      icon: "🔔",
      title: "Smart Reminders",
      description:
        "Get reminders to log drives, alerts when you're close to your permit expiration, and milestone notifications when you hit key hour checkpoints.",
    },
    {
      icon: "🏆",
      title: "Milestone Badges",
      description:
        "Celebrate progress with gamified milestone badges at 10, 25, 40, and 50 hours — keeping teens motivated throughout the permit period.",
    },
    {
      icon: "📄",
      title: "BA-CSD Ready Summary",
      description:
        "Generate a clean summary of all logged drives to make filling out the NJ MVC Certification of Supervised Driving (Form BA-CSD) fast and accurate.",
    },
  ]

  const steps = [
    {
      step: "01",
      title: "Create your teen's profile",
      description:
        "Enter the teen driver's name, birthday, permit issue date, and permit number. NJDrive50 immediately calculates your road test eligibility date and permit expiration.",
    },
    {
      step: "02",
      title: "Log every supervised drive",
      description:
        "After each practice session, log the drive with GPS tracking, duration, time of day, and which parent or guardian supervised. Day and night hours are tracked separately.",
    },
    {
      step: "03",
      title: "Monitor progress toward 50 hours",
      description:
        "Your dashboard shows a live breakdown of total hours, night hours remaining, days until road test eligibility, and milestone progress — all in one place.",
    },
    {
      step: "04",
      title: "Prepare for the road test",
      description:
        "When you've hit 50 hours (10 at night), NJDrive50 generates a clean drive summary to help complete NJMVC Form BA-CSD. Then book your road test with confidence.",
    },
  ]

  return (
    <>
      <Helmet>
        <title>NJDrive50 — NJ Teen Driver Hours Tracker & Permit Log App</title>
        <meta
          name="description"
          content="Track your teen's 50 supervised driving hours for the New Jersey learner permit. NJDrive50 logs drives, counts permit milestones, and sends reminders — built specifically for NJ families."
        />

        {/* Open Graph */}
        <meta property="og:title" content="NJDrive50 — NJ Teen Driver Hours Tracker" />
        <meta
          property="og:description"
          content="Log and monitor supervised driving hours for the NJ learner permit. Built specifically for New Jersey teens and parents."
        />
        <meta property="og:image" content="https://njdrive50.com/og-image.png" />
        <meta property="og:url" content="https://njdrive50.com" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NJDrive50 — NJ Teen Driver Hours Tracker" />
        <meta
          name="twitter:description"
          content="Track supervised driving hours for the New Jersey learner permit."
        />
        <meta name="twitter:image" content="https://njdrive50.com/og-image.png" />

        <link rel="canonical" href="https://njdrive50.com" />

        {/* SoftwareApplication Schema */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "NJDrive50",
            "operatingSystem": "Android, iOS",
            "applicationCategory": "UtilitiesApplication",
            "description": "NJDrive50 helps New Jersey teens and parents track supervised driving hours for the NJ learner permit, log individual drives with GPS, and monitor progress toward the 50-hour requirement.",
            "image": "https://njdrive50.com/og-image.png",
            "url": "https://njdrive50.com",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Person",
              "name": "David",
              "address": {
                "@type": "PostalAddress",
                "addressRegion": "NJ",
                "addressCountry": "US"
              }
            }
          }
        `}</script>

        {/* FAQPage Schema */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How many supervised driving hours are required for a NJ learner permit?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "As of February 1, 2025, New Jersey requires all permit holders under 21 to complete a minimum of 50 hours of supervised driving — including at least 10 hours at night — before they can apply for a probationary driver license."
                }
              },
              {
                "@type": "Question",
                "name": "Who can supervise a teen driver in New Jersey?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A parent, guardian, or any licensed driver over the age of 21 who has held their NJ driver's license for at least three years. A certified driving school instructor also qualifies."
                }
              },
              {
                "@type": "Question",
                "name": "Do I have to submit my driving log to the NJ MVC?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. The NJ MVC does not require you to submit your driving log. However, you must submit a signed Certification of Supervised Driving (NJMVC Form BA-CSD) when applying for your probationary license."
                }
              },
              {
                "@type": "Question",
                "name": "How long is a New Jersey learner permit valid?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A New Jersey learner's permit is valid for 2 years from the issue date. You must also wait at least 6 months after your permit issue date before you can take your road test."
                }
              },
              {
                "@type": "Question",
                "name": "Does NJDrive50 work on Android?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. NJDrive50 is built for Android and is designed specifically for NJ families tracking supervised driving hours toward the NJ MVC 50-hour requirement."
                }
              },
              {
                "@type": "Question",
                "name": "Is NJDrive50 free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. NJDrive50 is completely free for all New Jersey families."
                }
              }
            ]
          }
        `}</script>
      </Helmet>

      <div className="min-h-screen bg-[#020617] text-white">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#38BDF8]/15 shadow-lg ring-1 ring-[#38BDF8]/30">
                <span className="text-base">🚗</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-[0.18em] text-[#38BDF8]">
                  NJDRIVE50
                </span>
                <span className="text-[11px] font-medium text-white/60">
                  NJ Teen Driving Log
                </span>
              </div>
            </div>

            <nav className="hidden gap-6 text-xs font-semibold text-white/60 sm:flex">
              <a href="#how-it-works" className="transition hover:text-white">
                How it works
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#faq" className="transition hover:text-white">
                FAQ
              </a>
            </nav>

            <a
              href="#get-app"
              className="rounded-xl bg-[#38BDF8] px-4 py-2 text-xs font-extrabold text-[#020617] transition hover:bg-[#0EA5E9]"
            >
              Get the App
            </a>
          </div>
        </header>

        <main>

          {/* ── Hero ── */}
          <section className="relative overflow-hidden border-b border-white/10">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 -top-32 flex justify-center">
              <div className="h-[500px] w-[700px] rounded-full bg-[#38BDF8]/5 blur-[120px]" />
            </div>

            <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
              <div className="max-w-xl">
                {/* Badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                  <span className="text-[11px] font-bold tracking-[0.18em] text-[#38BDF8]">
                    NEW NJ LAW — EFFECTIVE FEB 1, 2025
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  Track your teen&apos;s{" "}
                  <span className="text-[#38BDF8]">
                    New Jersey driving hours
                  </span>{" "}
                  with confidence.
                </h1>

                <p className="mt-5 text-sm leading-relaxed text-white/70 sm:text-base">
                  NJDrive50 is built for New Jersey families navigating the new
                  50-hour supervised driving requirement. Log practice drives,
                  split day and night hours, track your road test eligibility
                  date, and generate your NJ MVC Form BA-CSD summary — all in
                  one free app.
                </p>

                {/* Stats bar */}
                <div className="mt-6 flex flex-wrap gap-4">
                  {[
                    { value: "50", label: "Total hours required" },
                    { value: "10", label: "Night hours required" },
                    { value: "6 mo", label: "Minimum permit hold" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="flex flex-col rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center"
                    >
                      <span className="text-lg font-extrabold text-[#38BDF8]">
                        {value}
                      </span>
                      <span className="text-[10px] text-white/50">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    id="get-app"
                    href="#"
                    className="rounded-xl bg-[#38BDF8] px-6 py-3 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] transition hover:bg-[#0EA5E9]"
                  >
                    Get NJDrive50 — Free
                  </a>
                  <a
                    href="#how-it-works"
                    className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                  >
                    See how it works
                  </a>
                </div>

                <p className="mt-3 text-[11px] text-white/40">
                  Built for NJ learner permits issued on or after February 1,
                  2025 · Free · Android
                </p>
              </div>

              {/* Phone mockup */}
              <div className="flex flex-1 justify-center">
                <div className="relative h-[340px] w-[200px]">
                  <div className="absolute inset-0 rounded-[36px] border border-white/15 bg-gradient-to-b from-[#0F172A] to-[#020617] shadow-[0_40px_100px_rgba(15,23,42,0.9)]">
                    {/* Mock screen content */}
                    <div className="flex h-full flex-col gap-3 p-4 pt-8">
                      <div className="text-center">
                        <p className="text-[10px] text-white/40">Total Hours</p>
                        <p className="text-3xl font-extrabold text-[#38BDF8]">
                          32.5
                        </p>
                        <p className="text-[10px] text-white/40">of 50 hours</p>
                      </div>
                      <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#38BDF8]"
                          style={{ width: "65%" }}
                        />
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {[
                          { label: "Day", value: "26.5h", color: "text-yellow-400" },
                          { label: "Night", value: "6.0h", color: "text-[#38BDF8]" },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            className="rounded-xl bg-white/5 p-2 text-center"
                          >
                            <p className={`text-sm font-bold ${color}`}>
                              {value}
                            </p>
                            <p className="text-[9px] text-white/40">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 rounded-xl bg-white/5 p-2.5">
                        <p className="text-[9px] text-white/50">
                          Road test eligible in
                        </p>
                        <p className="text-sm font-bold text-white">47 days</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-2.5">
                        <p className="text-[9px] text-white/50">
                          Night hours needed
                        </p>
                        <p className="text-sm font-bold text-yellow-400">
                          4.0 hrs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Trust bar ── */}
          <section className="border-b border-white/10 bg-white/[0.02]">
            <div className="mx-auto max-w-5xl px-4 py-5">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold tracking-[0.14em] text-white/40">
                <span>✓ NJ MVC 50-HOUR COMPLIANT</span>
                <span className="hidden sm:block">·</span>
                <span>✓ FORM BA-CSD READY</span>
                <span className="hidden sm:block">·</span>
                <span>✓ DAY + NIGHT TRACKING</span>
                <span className="hidden sm:block">·</span>
                <span>✓ 100% FREE</span>
              </div>
            </div>
          </section>

          {/* ── How It Works ── */}
          <section id="how-it-works" className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  The Process
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  How NJDrive50 works
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
                  From permit day to road test — here&apos;s how NJDrive50
                  guides NJ families every step of the way.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map(({ step, title, description }) => (
                  <div
                    key={step}
                    className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <span className="mb-3 block text-3xl font-extrabold text-[#38BDF8]/25">
                      {step}
                    </span>
                    <h3 className="mb-2 text-sm font-bold text-white">
                      {title}
                    </h3>
                    <p className="text-xs leading-relaxed text-white/55">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ── */}
          <section id="features" className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  Built for NJ Families
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Everything you need to hit 50 hours
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
                  NJDrive50 is the only driving log app built specifically for
                  the New Jersey MVC supervised driving requirement.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#38BDF8]/20 hover:bg-white/[0.05]"
                  >
                    <span className="mb-3 block text-2xl">{icon}</span>
                    <h3 className="mb-1.5 text-sm font-bold text-white">
                      {title}
                    </h3>
                    <p className="text-xs leading-relaxed text-white/55">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── NJ Law Callout ── */}
          <section className="border-b border-white/10 bg-[#38BDF8]/5">
            <div className="mx-auto max-w-5xl px-4 py-12">
              <div className="flex flex-col gap-6 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-6 sm:flex-row sm:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-xl">
                  📋
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#38BDF8]">
                    New NJ Law — Effective February 1, 2025
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    The NJ Motor Vehicle Commission now requires all permit
                    holders under 21 (with permits issued on or after February
                    1, 2025) to complete{" "}
                    <strong className="text-white">
                      50 hours of supervised driving
                    </strong>
                    , including{" "}
                    <strong className="text-white">10 hours at night</strong>,
                    before receiving a probationary license. A signed{" "}
                    <strong className="text-white">
                      Certification of Supervised Driving (Form BA-CSD)
                    </strong>{" "}
                    must be submitted to the NJ MVC. NJDrive50 is designed to
                    make meeting this requirement simple, trackable, and
                    stress-free.
                  </p>
                  <a
                    href="https://www.nj.gov/mvc/license/youngadult.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-[#38BDF8] underline underline-offset-2 hover:text-white"
                  >
                    Read the official NJ MVC requirements →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section id="faq" className="border-b border-white/10">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  Common Questions
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  NJ permit &amp; driving FAQ
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
                  Answers to the most common questions about the NJ MVC 50-hour
                  requirement and how NJDrive50 fits in.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map(({ question, answer }) => (
                  <details
                    key={question}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] open:border-[#38BDF8]/20 open:bg-white/[0.05]"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-sm font-semibold text-white">
                      <span>{question}</span>
                      <span className="mt-0.5 shrink-0 text-[#38BDF8] transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-white/60">
                      {answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-20 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                Start Today
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                Start logging drives.{" "}
                <span className="text-[#38BDF8]">Hit 50 hours faster.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm text-white/60">
                NJDrive50 is free, built for New Jersey, and designed to take
                the stress out of the 50-hour permit requirement.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="#"
                  className="rounded-xl bg-[#38BDF8] px-8 py-3.5 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] transition hover:bg-[#0EA5E9]"
                >
                  Download NJDrive50 — Free
                </a>
              </div>
              <p className="mt-4 text-[11px] text-white/35">
                Android · Designed for NJ MVC learner permit holders
              </p>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-white/10 bg-black/40">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-sm ring-1 ring-[#38BDF8]/20">
                  🚗
                </div>
                <span className="text-sm font-bold tracking-[0.16em] text-[#38BDF8]">
                  NJDRIVE50
                </span>
              </div>
              <p className="mt-2 max-w-[28ch] text-[11px] leading-relaxed text-white/40">
                The free NJ teen driving hours tracker built for the NJ MVC
                50-hour supervised driving requirement.
              </p>
            </div>

            <div className="flex flex-col gap-1 text-xs text-white/40">
              <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">
                Legal
              </p>
              <a href="#privacy" className="hover:text-white/70">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-white/70">
                Terms of Use
              </a>
            </div>

            <div className="flex flex-col gap-1 text-xs text-white/40">
              <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">
                Resources
              </p>
              <a
                href="https://www.nj.gov/mvc/license/youngadult.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70"
              >
                NJ MVC First License Info
              </a>
              <a
                href="https://www.nj.gov/mvc/license/roadtest.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70"
              >
                NJ MVC Road Test Info
              </a>
            </div>
          </div>

          <div className="border-t border-white/5 px-4 py-4 text-center text-[11px] text-white/25">
            © {new Date().getFullYear()} NJDrive50. All rights reserved. Not
            affiliated with the New Jersey Motor Vehicle Commission.
          </div>
        </footer>
      </div>
    </>
  )
}