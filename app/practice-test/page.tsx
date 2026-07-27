"use client";

import { useEffect } from "react"
import PracticeTestPanel from "@/src/screens/PracticeTestPanel"

const SITE_URL = "https://njdrive50.com"
const ROUTE_PATH = "/new-jersey-permit-practice-test"
const PAGE_URL = `${SITE_URL}${ROUTE_PATH}`
const LANDING_PAGE_URL = SITE_URL
const PAGE_TITLE = "Free NJ Permit Practice Test (2026) | NJDrive50"

const PAGE_DESCRIPTION =
  "Practice the 2026 NJ MVC permit test with 50 free realistic questions, instant explanations, unlimited attempts, and no sign-up. Prepare for your New Jersey permit test with NJDrive50."

const FAQS = [
  {
    question: "Is this New Jersey permit practice test free?",
    answer:
      "Yes. This page offers a completely free New Jersey permit practice test with 50 questions and no registration required. Choose Part 1 (questions 1–25), Part 2 (questions 26–50), or Full Round (all 50) and start immediately.",
  },
  {
    question: "How many questions are on the real NJ permit test?",
    answer:
      "The real New Jersey MVC knowledge test has 50 questions. You need to answer at least 40 correctly — an 80% score — to pass. This practice test mirrors that format exactly.",
  },
  {
    question: "Are the answers shuffled on this practice test?",
    answer:
      "Yes. Every time you start a new session, the four answer choices for each question are randomly shuffled so you practice recognizing the right answer, not memorizing its position.",
  },
  {
    question: "Is this the official NJ MVC permit test?",
    answer:
      "No. This is a free study tool based on topics covered in the official New Jersey Driver Manual. It is designed to help you prepare for the real NJ MVC knowledge test, not replace it.",
  },
  {
    question: "What is NJDrive50?",
    answer:
      "NJDrive50 is a free app that helps New Jersey families track supervised driving hours, stay organized during the permit stage, and support progress through the full NJ GDL journey. After you pass your permit test, NJDrive50 is the next step.",
  },
  {
    question: "What score do I need to pass the NJ permit test?",
    answer:
      "You need to answer at least 40 out of 50 questions correctly — an 80% passing score — on the real New Jersey MVC knowledge test. This practice test uses the same 80% benchmark so you know exactly where you stand.",
  },
] as const

function upsertMeta(
  key: string,
  content: string,
  attribute: "name" | "property" = "name",
) {
  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`,
  ) as HTMLMetaElement | null

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attribute, key)
    element.setAttribute("data-seo-managed", "true")
    document.head.appendChild(element)
  }

  element.setAttribute("content", content)
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector(
    `link[rel="${rel}"][data-seo-managed="true"]`,
  ) as HTMLLinkElement | null

  if (!element) {
    element = document.createElement("link")
    element.setAttribute("rel", rel)
    element.setAttribute("data-seo-managed", "true")
    document.head.appendChild(element)
  }

  element.setAttribute("href", href)
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let element = document.head.querySelector(
    `script[data-seo-id="${id}"]`,
  ) as HTMLScriptElement | null

  if (!element) {
    element = document.createElement("script")
    element.type = "application/ld+json"
    element.setAttribute("data-seo-id", id)
    element.setAttribute("data-seo-managed", "true")
    document.head.appendChild(element)
  }

  element.textContent = JSON.stringify(data)
}

export default function PublicPracticeTestPage() {
  useEffect(() => {
    const previousTitle = document.title

    const previousDescriptionTag = document.head.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null
    const previousDescription = previousDescriptionTag?.getAttribute("content") ?? null

    document.title = PAGE_TITLE

    upsertMeta("description", PAGE_DESCRIPTION)
    upsertMeta("robots", "index, follow")
    upsertLink("canonical", PAGE_URL)

    upsertMeta("og:type", "website", "property")
    upsertMeta("og:title", PAGE_TITLE, "property")
    upsertMeta("og:description", PAGE_DESCRIPTION, "property")
    upsertMeta("og:url", PAGE_URL, "property")
    upsertMeta("og:site_name", "NJDrive50", "property")
    upsertMeta("og:image", `${SITE_URL}/og-practice-test.png`, "property")
    upsertMeta("og:image:width", "1200", "property")
    upsertMeta("og:image:height", "630", "property")

    upsertMeta("twitter:card", "summary_large_image")
    upsertMeta("twitter:title", PAGE_TITLE)
    upsertMeta("twitter:description", PAGE_DESCRIPTION)
    upsertMeta("twitter:url", PAGE_URL)
    upsertMeta("twitter:image", `${SITE_URL}/og-practice-test.png`)

    upsertJsonLd("public-practice-test-webpage", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${PAGE_URL}#webpage`,
          url: PAGE_URL,
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          dateModified: "2026-06-21",
          inLanguage: "en-US",
          isPartOf: { "@id": `${SITE_URL}/#website` },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "NJDrive50",
                item: `${SITE_URL}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "NJ Permit Practice Test",
                item: PAGE_URL,
              },
            ],
          },
          about: [
            { "@type": "Thing", name: "New Jersey permit practice test" },
            { "@type": "Thing", name: "New Jersey MVC knowledge test" },
            { "@type": "Thing", name: "New Jersey GDL" },
            { "@type": "Thing", name: "Supervised driving hours" },
          ],
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: "NJDrive50",
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "NJDrive50",
          url: `${SITE_URL}/`,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo.png`,
          },
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}/#software`,
          name: "NJDrive50",
          applicationCategory: "EducationalApplication",
          operatingSystem: "iOS, Android, Web",
          url: `${SITE_URL}/`,
          description:
            "NJDrive50 helps New Jersey families track supervised driving hours, stay organized during the permit stage, and support progress through the full NJ GDL journey.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          publisher: { "@id": `${SITE_URL}/#organization` },
        },
        {
          "@type": "Quiz",
          "@id": `${PAGE_URL}#quiz`,
          name: "Free New Jersey Permit Practice Test",
          description:
            "A 50-question free New Jersey permit practice test based on the NJ Driver Manual, with shuffled answers and instant explanations.",
          url: PAGE_URL,
          educationalLevel: "beginner",
          about: { "@type": "Thing", name: "New Jersey MVC knowledge test" },
          provider: { "@id": `${SITE_URL}/#organization` },
        },
        {
          "@type": "FAQPage",
          "@id": `${PAGE_URL}#faq`,
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ],
    })

    return () => {
      document.title = previousTitle

      const managedNodes = document.head.querySelectorAll('[data-seo-managed="true"]')
      managedNodes.forEach((node) => node.remove())

      if (previousDescription !== null) {
        let descriptionTag = document.head.querySelector(
          'meta[name="description"]',
        ) as HTMLMetaElement | null

        if (!descriptionTag) {
          descriptionTag = document.createElement("meta")
          descriptionTag.setAttribute("name", "description")
          document.head.appendChild(descriptionTag)
        }

        descriptionTag.setAttribute("content", previousDescription)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#08194A] px-4 pt-0 pb-6 text-[#08194A]">
      <a
        href="#practice-test"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-[#08194A] focus:shadow-lg"
      >
        Skip to practice test
      </a>

      <main
        className="mx-auto w-full max-w-md px-0 sm:max-w-2xl lg:max-w-[1500px] lg:px-4"
        aria-label="Free New Jersey permit practice test"
      >
        {/* ── Compact header (kept short so the quiz is visible without scrolling) ── */}
        <section
          className="mt-3 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="practice-page-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
                  NJ Permit Practice Test · 2026
                </p>

                <p className="mt-1 text-xs font-semibold text-[#08194A]/45">
                  By NJDrive50
                </p>

                <h1
                  id="practice-page-title"
                  className="mt-1 text-2xl font-black leading-tight text-[#08194A] lg:text-3xl"
                >
                  Free NJ Permit Practice Test (2026)
                </h1>

                {/*
                  Subtitle rewritten to lead with a benefit ("get comfortable before test day")
                  rather than a list of features. Still naturally includes: 50 questions,
                  NJ MVC, shuffled answers, instant explanations, unlimited attempts,
                  no sign-up, and 80% passing score — without stacking them as keyword clauses.
                */}
                <p className="mt-2 text-sm leading-relaxed text-[#08194A]/72 lg:max-w-2xl">
                  Take as many attempts as you need with 50 NJ MVC-style
                  questions, shuffled answers, and instant explanations after
                  each one. No sign-up — just practice until you can hit the
                  80% passing score.
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:shrink-0 lg:grid-cols-2">
                <a
                  href="#practice-test"
                  className="flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#08194A] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
                >
                  Start Practice Test
                </a>

                <a
                  href={LANDING_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#f9c80e] px-5 py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.20)] transition hover:-translate-y-[1px] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2"
                >
                  Get NJDrive50
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Practice test panel — right at the top, no scrolling required ── */}
        <section
          id="practice-test"
          tabIndex={-1}
          aria-label="New Jersey permit practice quiz"
          className="mt-3 scroll-mt-6"
        >
          <PracticeTestPanel />
        </section>

        {/* ── Quick facts + topics (moved below the quiz) ─────────────────── */}
        <section
          className="mt-3 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="test-details-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#08194A] via-[#f9c80e] to-[#ffe27a]" />

          <div className="p-5 sm:p-6 lg:p-10">
            <h2 id="test-details-title" className="sr-only">
              Practice test details
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { stat: "50", label: "Questions" },
                { stat: "80%", label: "To Pass" },
                { stat: "Shuffled", label: "Each Attempt" },
                { stat: "Free", label: "No Sign-Up" },
              ].map(({ stat, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center"
                >
                  <p className="text-lg font-black text-[#08194A]">{stat}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#08194A]/72 lg:max-w-3xl">
              This test is based on the{" "}
              <a
                href="https://www.nj.gov/mvc/vehicles/manuals.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#08194A] underline underline-offset-2"
              >
                NJ Driver Manual
              </a>{" "}
              and mirrors the format of the real{" "}
              <a
                href="https://www.nj.gov/mvc/license/knowledgetest.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#08194A] underline underline-offset-2"
              >
                NJ MVC knowledge test
              </a>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-[#08194A]/10 bg-[#F4F6FA] p-4 lg:p-5">
              <h3 className="text-sm font-bold text-[#08194A]">
                What this NJ permit practice test covers
              </h3>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-[#08194A]/78 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Road signs and pavement markings",
                  "NJ speed limits and school zones",
                  "Right-of-way and yielding rules",
                  "GDL restrictions for new drivers",
                  "Safe following distance",
                  "Distracted and impaired driving",
                  "Emergency vehicle rules",
                  "NJ Move Over law",
                  "Roundabouts and lane changes",
                  "BAC limits and DUI laws",
                ].map((topic) => (
                  <li key={topic} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#f9c80e]" aria-hidden="true">
                      ✓
                    </span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section
          className="mt-3 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="how-it-works-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#08194A] via-[#f9c80e] to-[#ffe27a]" />

          <div className="p-5 sm:p-6 lg:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              How this practice test works
            </p>

            <h2
              id="how-it-works-title"
              className="mt-2 text-2xl font-black leading-tight text-[#08194A]"
            >
              Built to match the real NJ MVC exam
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[#08194A]/72 lg:max-w-3xl">
              The real New Jersey MVC knowledge test has 50 questions and requires
              an 80% passing score — 40 correct answers. This practice test uses
              the same format so your results reflect your real readiness.
            </p>

            <ol className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {[
                {
                  step: "1",
                  title: "Choose your round",
                  desc: "Pick Part 1 (questions 1–25), Part 2 (questions 26–50), or Full Round (all 50). Each session takes 5–15 minutes.",
                },
                {
                  step: "2",
                  title: "Answer each question",
                  desc: "Answers are shuffled every attempt so you learn to recognize the right answer, not its position on the screen.",
                },
                {
                  step: "3",
                  title: "See your explanation",
                  desc: "After each answer you get an instant explanation so you understand why — not just what — the correct answer is.",
                },
                {
                  step: "4",
                  title: "Check your score",
                  desc: "Your final score shows you whether you are in passing range (80%+) or need more practice before your MVC appointment.",
                },
              ].map(({ step, title, desc }) => (
                <li
                  key={step}
                  className="flex gap-4 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#08194A] text-sm font-black text-[#f9c80e]">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#08194A]">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#08194A]/70">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── NJDrive50 CTA ─────────────────────────────────────────────────── */}
        <section
          className="mt-3 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="beyond-quiz-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

          <div className="p-5 sm:p-6 lg:p-10">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8">
              <div>
                {/*
                  Eyebrow rewritten to pose the question the visitor is actually
                  asking themselves right after passing — sets up the emotional
                  transition before the headline answers it.
                */}
                <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
                  You passed the permit test. Now what?
                </p>

                {/*
                  Headline changed from "just the beginning" (abstract) to naming
                  the real timeframe (one day vs. six months). This is the
                  emotional contrast that makes the next section feel necessary
                  rather than promotional.
                */}
                <h2
                  id="beyond-quiz-title"
                  className="mt-2 text-2xl font-black leading-tight text-[#08194A]"
                >
                  The permit test takes a day. The next six months take work.
                </h2>

                {/*
                  Body copy restructured to introduce the problem (tracking 50
                  hours of supervised driving accurately over 6 months) before
                  naming NJDrive50 as the solution — and corrects the previous
                  "6 supervised hours" error to the actual NJ MVC requirement
                  of 50 hours, including 10 at night, confirmed via NJ MVC's
                  own Certification of Supervised Driving requirements.
                */}
                <p className="mt-3 text-sm leading-relaxed text-[#08194A]/72">
                  New Jersey requires 50 hours of supervised driving, including
                  10 hours at night, over a 6-month period before your teen
                  can apply for a probationary license. Most families end up
                  guessing at hours from memory or juggling a paper log that
                  gets lost. NJDrive50 was built to solve exactly that.
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  {[
                    "Log each supervised drive in seconds — date, time, conditions, and notes.",
                    "See progress toward the 50-hour and 10-hour nighttime requirements at a glance.",
                    "Keep parents and teens working from the same numbers, no spreadsheets needed.",
                    "Get reminded before the 6-month clock runs out on the road test window.",
                  ].map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2.5"
                    >
                      <span className="mt-0.5 shrink-0 text-[#f9c80e]" aria-hidden="true">
                        ✓
                      </span>
                      <p className="text-[#08194A]/80">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 lg:mt-0">
                <div className="overflow-hidden rounded-2xl bg-[#08194A] shadow-[0_14px_28px_rgba(8,25,74,0.20)]">
                  <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-white/50 to-[#0A1E5E]" />
                  <div className="p-4">
                    <p className="text-sm font-bold text-white">
                      NJDrive50 is free — no subscription, no hidden fees.
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">
                      Used by NJ families to track every supervised drive from
                      permit to probationary license.
                    </p>
                    {/*
                      CTA changed from brand-name-only ("Start NJDrive50 Free")
                      to an outcome-focused action, matching the request to
                      describe what the user gets, not just the product name.
                    */}
                    <a
                      href={LANDING_PAGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#f9c80e] py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] transition hover:-translate-y-[1px] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
                    >
                      Start Tracking Driving Hours Free
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <a
                    href="#practice-test"
                    className="flex w-full items-center justify-center rounded-xl border-2 border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:border-[#08194A]/25 hover:bg-[#eef0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
                  >
                    Take Another Practice Round
                  </a>

                  {/*
                    Second CTA changed from generic "Explore NJDrive50" to a
                    concrete action, per the request to focus on outcomes
                    rather than the brand name alone.
                  */}
                  <a
                    href={LANDING_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.18)] transition hover:-translate-y-[1px] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2"
                  >
                    Track Your Driving Hours
                  </a>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#08194A]/50">
              This page is a free New Jersey permit practice resource for study
              support only and does not replace the{" "}
              <a
                href="https://www.nj.gov/mvc/vehicles/manuals.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                official New Jersey Driver Manual
              </a>
              .
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section
          className="mt-3 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="faq-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#08194A] via-[#f9c80e] to-[#ffe27a]" />

          <div className="p-5 sm:p-6 lg:p-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              Frequently asked questions
            </p>

            <h2
              id="faq-title"
              className="mt-2 text-2xl font-black leading-tight text-[#08194A]"
            >
              NJ permit practice test — common questions
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {FAQS.map((item) => (
                <div
                  key={item.question}
                  className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4"
                >
                  <h3 className="text-sm font-bold text-[#08194A]">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#08194A]/75">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-[#08194A]/50">
              Last reviewed: June 2026. Based on the New Jersey Driver Manual and
              NJ MVC knowledge test format. For the most current information,
              visit the{" "}
              <a
                href="https://www.nj.gov/mvc/license/knowledgetest.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                official NJ MVC knowledge test page
              </a>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}