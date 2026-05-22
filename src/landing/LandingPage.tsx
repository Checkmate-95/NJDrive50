import { Helmet } from "react-helmet-async"
import FloatingAIButton from "../components/FloatingAIButton"
import { useNav } from "../state/navStore"

export default function LandingPage() {
  const { setScreen } = useNav()

  const faqs = [
    {
      question: "How many supervised driving hours are required in NJ?",
      answer:
        "New Jersey requires permit holders under 21 with permits issued on or after February 1, 2025 to complete at least 50 hours of supervised driving, including 10 hours of night driving, before they can receive a probationary driver license.",
    },
    {
      question: "How many night driving hours are required in NJ?",
      answer:
        "New Jersey requires at least 10 hours of night driving as part of the 50-hour supervised driving requirement for permit holders under 21 who received a permit on or after February 1, 2025.",
    },
    {
      question: "Who can supervise a teen driver in New Jersey?",
      answer:
        "A parent, guardian, or supervising driver who is at least 21 years old and has held a New Jersey driver license for at least three years may supervise practice driving. A licensed driving school instructor also qualifies under NJ permit rules.",
    },
    {
      question: "Do I have to submit my driving log to the NJ MVC?",
      answer:
        "No. The NJ MVC does not require you to submit your practice driving log. However, you must bring a signed Certification of Supervised Driving (NJMVC Form BA-CSD) when applying for your probationary license. NJDrive50 helps you keep an accurate New Jersey 50-hour driving log so that certification is easier to complete.",
    },
    {
      question: "How long is a New Jersey learner permit valid?",
      answer:
        "A New Jersey learner's permit is generally valid for 2 years from the issue date. Drivers under 21 must also wait at least 6 months from permit issuance before taking the NJ road test and applying for a probationary license.",
    },
    {
      question: "How do I track driving hours in NJ?",
      answer:
        "The easiest way to track driving hours in NJ is to log each supervised drive by date, time, duration, and whether the drive happened during the day or at night. NJDrive50 automatically tracks total supervised driving hours, night driving hours, and permit milestones in one place.",
    },
    {
      question: "Does NJDrive50 work on Android?",
      answer:
        "Yes. NJDrive50 is built for Android and designed specifically for New Jersey families who need a NJ driving log app to track supervised driving hours, permit milestones, and road test readiness.",
    },
    {
      question: "Is NJDrive50 free?",
      answer:
        "NJDrive50 includes a 7-day free trial, then costs $4.99 per month or $39.99 per year for New Jersey families.",
    },
  ]

  const features = [
    {
      icon: "🕐",
      title: "Track day and night driving hours",
      description:
        "Automatically separate daytime and night driving hours so you always know how many of the required 50 total hours and 10 night hours are left.",
    },
    {
      icon: "📍",
      title: "Log every NJ practice drive",
      description:
        "Save each supervised drive with GPS route data, start and end times, duration, and distance to keep your New Jersey driving log organized.",
    },
    {
      icon: "📋",
      title: "See permit and road test dates",
      description:
        "Track your permit issue date, road test eligibility date, and permit expiration so you can stay on top of New Jersey learner permit deadlines.",
    },
    {
      icon: "🔔",
      title: "Get reminders before you fall behind",
      description:
        "Receive reminders to log drives, alerts before permit expiration, and milestone nudges so your family stays on pace for the NJ road test.",
    },
    {
      icon: "🏆",
      title: "Keep teens motivated to finish 50 hours",
      description:
        "Celebrate progress at 10, 25, 40, and 50 hours with simple milestones that make the NJ supervised driving process easier to stick with.",
    },
    {
      icon: "📄",
      title: "Stay ready for NJMVC Form BA-CSD",
      description:
        "Generate a clean supervised driving summary to make the Certification of Supervised Driving faster and less stressful to complete.",
    },
  ]

  const steps = [
    {
      step: "01",
      title: "Create your teen driver's profile",
      description:
        "Enter the teen driver's name, birthday, permit issue date, and permit number. NJDrive50 instantly calculates the 6-month waiting period, road test eligibility date, and permit expiration.",
    },
    {
      step: "02",
      title: "Log each supervised drive",
      description:
        "After every practice session, record the drive with GPS tracking, duration, time of day, and supervising adult. Day and night driving hours are tracked separately.",
    },
    {
      step: "03",
      title: "Watch progress toward 50 hours",
      description:
        "See total supervised driving hours, night hours remaining, days until road test eligibility, and milestone progress in one clear dashboard.",
    },
    {
      step: "04",
      title: "Prepare for the NJ road test",
      description:
        "Once you reach 50 hours, including 10 hours at night, NJDrive50 helps you prepare a clean summary for NJMVC Form BA-CSD so you can move toward a probationary license with confidence.",
    },
  ]

  const PAGE_URL = "https://njdrive50.com"
  const OG_IMAGE_URL = "https://njdrive50.com/og-image.png"
  const PRICING_PAGE_PATH = "/pricing"

  const metaTitle =
    "NJDrive50 | New Jersey 50-Hour Driving Log App for NJ Supervised Driving Hours"
  const metaDescription =
    "NJDrive50 is a New Jersey driving log app for parents and teens. Track 50 supervised driving hours, 10 night driving hours, permit milestones, and NJMVC Form BA-CSD progress with a 7-day free trial."

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${PAGE_URL}#softwareapp`,
    name: "NJDrive50",
    url: PAGE_URL,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Android",
    description:
      "NJDrive50 is an NJ driving log app for New Jersey families to track supervised driving hours, night driving hours, permit dates, and progress toward the NJ MVC 50-hour requirement.",
    image: OG_IMAGE_URL,
    screenshot: OG_IMAGE_URL,
    installUrl: `${PAGE_URL}${PRICING_PAGE_PATH}`,
    offers: {
      "@type": "Offer",
      price: "4.99",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${PAGE_URL}${PRICING_PAGE_PATH}`,
      category: "Subscription",
      eligibleTransactionVolume: {
        "@type": "PriceSpecification",
        price: "4.99",
        priceCurrency: "USD",
      },
    },
    areaServed: {
      "@type": "State",
      name: "New Jersey",
    },
    audience: {
      "@type": "PeopleAudience",
      audienceType: "New Jersey parents and teen drivers",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${PAGE_URL}#organization`,
      name: "NJDrive50",
      url: PAGE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${PAGE_URL}/njdrive50Logo6.png`,
      },
    },
  }

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${PAGE_URL}#faq`,
    mainEntity: faqs.map(({ question, answer }) => ({
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
    "@id": `${PAGE_URL}#webpage`,
    url: PAGE_URL,
    name: metaTitle,
    description: metaDescription,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${PAGE_URL}#website`,
      name: "NJDrive50",
      url: PAGE_URL,
    },
    about: {
      "@id": `${PAGE_URL}#softwareapp`,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: OG_IMAGE_URL,
    },
  }

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta
          name="keywords"
          content="NJDrive50, New Jersey 50-hour driving log, NJ supervised driving hours, NJ teen driving requirements, NJ driving log app, track driving hours NJ, NJ MVC driving log, night driving hours NJ, parent teen driving app NJ, NJ road test requirements, New Jersey learner's permit rules, NJ practice driving log, how to track driving hours in NJ, NJ GDL requirements, NJ teen driver checklist, BA-CSD form, NJ permit rules, NJ probationary license"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="NJDrive50" />

        <link rel="canonical" href={PAGE_URL} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NJDrive50" />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:alt" content="NJDrive50 New Jersey driving log app" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />
        <meta name="twitter:image:alt" content="NJDrive50 New Jersey driving log app" />

        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-[#020617] text-white">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3">
            <div className="flex items-center gap-3">
              <img
                src="/njdrive50Logo6.png"
                alt="NJDrive50 Logo"
                className="h-20 w-auto object-contain"
              />

              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-[0.18em] text-[#38BDF8]">
                  NJDRIVE50
                </span>
                <span className="text-[11px] font-medium text-white/60">
                  New Jersey Teen Driving Log App
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
              <a href="#nj-requirements" className="transition hover:text-white">
                NJ requirements
              </a>
              <a href="#faq" className="transition hover:text-white">
                FAQ
              </a>
            </nav>

            <button
              type="button"
              onClick={() => setScreen("pricing")}
              aria-label="View NJDrive50 pricing and start free trial"
              className="rounded-xl bg-[#38BDF8] px-4 py-2 text-xs font-extrabold text-[#020617] transition hover:bg-[#0EA5E9]"
            >
              Start 7-Day Free Trial
            </button>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden border-b border-white/10">
            <div className="pointer-events-none absolute inset-0 -top-32 flex justify-center">
              <div className="h-[500px] w-[700px] rounded-full bg-[#38BDF8]/5 blur-[120px]" />
            </div>

            <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
              <div className="max-w-xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
                  <span className="text-[11px] font-bold tracking-[0.18em] text-[#38BDF8]">
                    NEW NJ LAW — EFFECTIVE FEB 1, 2025
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  How to track your teen&apos;s{" "}
                  <span className="text-[#38BDF8]">New Jersey 50-hour driving log</span>
                </h1>

                <p className="mt-5 text-sm leading-relaxed text-white/70 sm:text-base">
                  NJDrive50 is the NJ driving log app built for New Jersey families. Track NJ
                  supervised driving hours, separate day and night driving hours, monitor permit
                  milestones, and stay ready for NJMVC Form BA-CSD.
                </p>

                <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
                  If you need a simple way to track driving hours in NJ, NJDrive50 keeps everything
                  in one place so parents and teens can stay organized from permit day to the NJ
                  road test.
                </p>

                <div className="mt-6 flex flex-wrap gap-4">
                  {[
                    { value: "50", label: "Hours required in NJ" },
                    { value: "10", label: "Night hours required" },
                    { value: "6 mo", label: "Wait before road test" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="flex flex-col rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center"
                    >
                      <span className="text-lg font-extrabold text-[#38BDF8]">{value}</span>
                      <span className="text-[10px] text-white/50">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    id="get-app"
                    type="button"
                    onClick={() => setScreen("pricing")}
                    className="rounded-xl bg-[#38BDF8] px-6 py-3 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] transition hover:bg-[#0EA5E9]"
                  >
                    Start 7-Day Free Trial
                  </button>
                  <a
                    href="#how-it-works"
                    className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                  >
                    See how it works
                  </a>
                </div>

                <p className="mt-3 text-[11px] text-white/40">
                  7-day free trial · Cancel anytime for monthly plans · $4.99 per month or $39.99
                  per year · Cancel annual renewal before the next billing date
                </p>
              </div>

              <div className="flex flex-1 justify-center">
                <div className="relative h-[340px] w-[200px]">
                  <div className="absolute inset-0 rounded-[36px] border border-white/15 bg-gradient-to-b from-[#0F172A] to-[#020617] shadow-[0_40px_100px_rgba(15,23,42,0.9)]">
                    <div className="flex h-full flex-col gap-3 p-4 pt-8">
                      <div className="text-center">
                        <p className="text-[10px] text-white/40">Total Hours</p>
                        <p className="text-3xl font-extrabold text-[#38BDF8]">32.5</p>
                        <p className="text-[10px] text-white/40">of 50 hours</p>
                      </div>
                      <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#38BDF8]" style={{ width: "65%" }} />
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {[
                          { label: "Day", value: "26.5h", color: "text-yellow-400" },
                          { label: "Night", value: "6.0h", color: "text-[#38BDF8]" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="rounded-xl bg-white/5 p-2 text-center">
                            <p className={`text-sm font-bold ${color}`}>{value}</p>
                            <p className="text-[9px] text-white/40">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 rounded-xl bg-white/5 p-2.5">
                        <p className="text-[9px] text-white/50">Road test eligible in</p>
                        <p className="text-sm font-bold text-white">47 days</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-2.5">
                        <p className="text-[9px] text-white/50">Night hours needed</p>
                        <p className="text-sm font-bold text-yellow-400">4.0 hrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-white/10 bg-white/[0.02]">
            <div className="mx-auto max-w-5xl px-4 py-5">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-semibold tracking-[0.14em] text-white/40">
                <span>✓ NJ MVC 50-HOUR COMPLIANT</span>
                <span className="hidden sm:block">·</span>
                <span>✓ FORM BA-CSD READY</span>
                <span className="hidden sm:block">·</span>
                <span>✓ TRACK NIGHT DRIVING HOURS NJ</span>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  How It Works
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  How do you track driving hours in NJ?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
                  NJDrive50 helps parents and teens log practice driving, track night hours, and
                  stay ready for the NJ road test.
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
                    <h3 className="mb-2 text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/55">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="features" className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  Features
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  What should a NJ driving log app track?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
                  A good New Jersey driving log app should track supervised driving hours, night
                  driving hours, permit dates, and BA-CSD readiness without extra work.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#38BDF8]/20 hover:bg-white/[0.05]"
                  >
                    <span className="mb-3 block text-2xl" aria-hidden="true">
                      {icon}
                    </span>
                    <h3 className="mb-1.5 text-sm font-bold text-white">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/55">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="nj-requirements" className="border-b border-white/10 bg-[#38BDF8]/5">
            <div className="mx-auto max-w-5xl px-4 py-12">
              <div className="flex flex-col gap-6 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-6 sm:flex-row sm:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-xl">
                  📋
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#38BDF8]">
                    What are the NJ teen driving requirements?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Starting February 1, 2025, New Jersey requires permit holders under 21 with
                    permits issued on or after that date to complete{" "}
                    <strong className="text-white">50 hours of supervised driving</strong>,
                    including <strong className="text-white">10 hours at night</strong>, before
                    they can receive a probationary license.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    Drivers must also wait at least <strong className="text-white">6 months</strong>{" "}
                    from permit issuance before taking the NJ road test, and they must bring a
                    signed{" "}
                    <strong className="text-white">
                      Certification of Supervised Driving (Form BA-CSD)
                    </strong>{" "}
                    when applying for licensure.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="text-sm font-bold text-white">What NJDrive50 tracks</h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/60">
                        Total supervised driving hours, night driving hours, permit issue date,
                        permit expiration, road test eligibility, and BA-CSD preparation.
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <h3 className="text-sm font-bold text-white">What you need for the NJ MVC</h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/60">
                        A completed 50-hour practice period, 10 hours during darkness, a signed
                        BA-CSD form, and completion of the waiting period before road testing.
                      </p>
                    </div>
                  </div>
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

          <section className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  Checklist
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  What do you need before the NJ road test?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
                  Use this quick NJ teen driver checklist to stay on track with learner permit rules
                  and probationary license requirements.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Hold a valid New Jersey special learner's permit or examination permit.",
                  "Complete at least 50 hours of supervised driving practice.",
                  "Log at least 10 night driving hours in NJ.",
                  "Wait at least 6 months from the permit issue date before road testing.",
                  "Prepare your signed NJMVC Form BA-CSD.",
                  "Review NJ road test requirements before your appointment.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="faq" className="border-b border-white/10">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                  FAQ
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Common NJ permit and driving log questions
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
                  Quick answers about NJ supervised driving hours, night driving, BA-CSD, permit
                  rules, road test readiness, and pricing.
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

          <section className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-20 text-center">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#38BDF8]/70">
                Get Started
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                Ready to track supervised driving hours in NJ?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm text-white/60">
                Start your 7-day free trial of NJDrive50 to track driving hours, monitor night
                driving progress, and stay ready for the NJ road test and NJMVC Form BA-CSD.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setScreen("pricing")}
                  className="rounded-xl bg-[#38BDF8] px-8 py-3.5 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.35)] transition hover:bg-[#0EA5E9]"
                >
                  Start 7-Day Free Trial
                </button>
                <a
                  href="#faq"
                  className="rounded-xl border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Check NJ permit FAQs
                </a>
              </div>

              <p className="mt-3 text-[11px] text-white/50">
                7-day free trial · Cancel anytime for monthly plans · $4.99 per month or $39.99
                per year after trial · Annual plans can be canceled before renewal
              </p>
            </div>
          </section>

          <FloatingAIButton className="fixed bottom-6 right-6 z-50" />
        </main>

        <footer className="border-t border-white/10 bg-black/40">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <img
                  src="/njdrive50Logo6.png"
                  alt="NJDrive50 Logo"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-sm font-bold tracking-[0.16em] text-[#38BDF8]">
                  NJDRIVE50
                </span>
              </div>
              <p className="mt-2 max-w-[32ch] text-[11px] leading-relaxed text-white/40">
                The New Jersey 50-hour driving log app built for parents and teens tracking NJ
                supervised driving hours, night driving hours, and BA-CSD readiness.
              </p>
            </div>

            <div className="flex flex-col gap-1 text-xs text-white/40">
              <p className="mb-1 font-semibold uppercase tracking-[0.14em] text-white/25">Legal</p>
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
              <a
                href="https://nj.gov/mvc/pdf/license/BA-CSD.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/70"
              >
                NJMVC Form BA-CSD
              </a>
            </div>
          </div>

          <div className="border-t border-white/5 px-4 py-4 text-center text-[11px] text-white/25">
            © {new Date().getFullYear()} NJDrive50. All rights reserved. Not affiliated with the
            New Jersey Motor Vehicle Commission.
          </div>
        </footer>
      </div>
    </>
  )
}