import { useEffect } from "react"
import PracticeTestPanel from "./PracticeTestPanel"

const SITE_URL = "https://njdrive50.com"
const ROUTE_PATH = "/new-jersey-permit-practice-test"
const PAGE_URL = `${SITE_URL}${ROUTE_PATH}`
const LANDING_PAGE_URL = SITE_URL
const PAGE_TITLE = "Free New Jersey Permit Practice Test | NJDrive50"
const PAGE_DESCRIPTION =
  "Take a free New Jersey permit practice test with 23 questions, then use NJDrive50 to track supervised driving hours and support the full NJ permit journey."

const FAQS = [
  {
    question: "Is this New Jersey permit practice test free?",
    answer:
      "Yes. This page offers a free 23-question New Jersey permit practice round for study support.",
  },
  {
    question: "How many questions are in the practice test?",
    answer:
      "The practice round includes 23 questions and gives you a quick way to review common New Jersey permit-test topics.",
  },
  {
    question: "What is NJDrive50?",
    answer:
      "NJDrive50 helps families track supervised driving hours, stay organized, and support progress through the New Jersey permit journey.",
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
    upsertLink("canonical", PAGE_URL)

    upsertMeta("og:type", "website", "property")
    upsertMeta("og:title", PAGE_TITLE, "property")
    upsertMeta("og:description", PAGE_DESCRIPTION, "property")
    upsertMeta("og:url", PAGE_URL, "property")
    upsertMeta("og:site_name", "NJDrive50", "property")

    upsertMeta("twitter:card", "summary")
    upsertMeta("twitter:title", PAGE_TITLE)
    upsertMeta("twitter:description", PAGE_DESCRIPTION)
    upsertMeta("twitter:url", PAGE_URL)

    upsertJsonLd("public-practice-test-webpage", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${PAGE_URL}#webpage`,
          url: PAGE_URL,
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          about: [
            {
              "@type": "Thing",
              name: "New Jersey permit practice test",
            },
            {
              "@type": "Thing",
              name: "New Jersey GDL",
            },
            {
              "@type": "Thing",
              name: "Supervised driving hours",
            },
          ],
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: "NJDrive50",
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
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
            "NJDrive50 helps families track supervised driving hours, stay organized, and support progress through the New Jersey permit journey.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
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
    <div className="min-h-screen bg-[#08194A] px-4 py-6 text-[#08194A]">
      <a
        href="#practice-test"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-[#08194A] focus:shadow-lg"
      >
        Skip to practice test
      </a>

      <main
        className="mx-auto w-full max-w-md"
        aria-label="Free New Jersey permit practice test"
      >
        <section
          className="mb-5 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="practice-page-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

          <div className="p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              Free NJ Permit Practice Test
            </p>

            <h1
              id="practice-page-title"
              className="mt-2 text-3xl font-black leading-tight text-[#08194A]"
            >
              Free New Jersey permit practice test with a next step for the full NJ driving journey
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[#08194A]/72">
              Take a free New Jersey permit practice test with 23 questions based
              on common NJ knowledge-test topics. After the quiz, families can use
              NJDrive50 to track supervised driving hours, stay organized, and
              support progress through the New Jersey permit process.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={LANDING_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.20)] transition hover:-translate-y-[1px] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2"
              >
                Start NJDrive50
              </a>

              <a
                href="#practice-test"
                className="flex w-full items-center justify-center rounded-xl bg-[#08194A] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
              >
                Take Free Practice Test
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center">
                <p className="text-lg font-black text-[#08194A]">23</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                  Questions
                </p>
              </div>

              <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center">
                <p className="text-lg font-black text-[#08194A]">Random</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                  Each Attempt
                </p>
              </div>

              <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-3 text-center">
                <p className="text-lg font-black text-[#08194A]">Free</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/55">
                  Study Tool
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#08194A]/10 bg-[#F4F6FA] p-4">
              <h2 className="text-sm font-semibold text-[#08194A]">
                Why people use this free NJ practice test
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#08194A]/78">
                <li>Practice with a fast, mobile-friendly New Jersey permit quiz.</li>
                <li>Build confidence before taking the NJ written knowledge test.</li>
                <li>Move into NJDrive50 when it is time to track real driving progress.</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          id="practice-test"
          tabIndex={-1}
          aria-label="New Jersey permit practice quiz"
          className="scroll-mt-6"
        >
          <PracticeTestPanel />
        </section>

        <section
          className="mt-5 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="beyond-quiz-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#08194A] via-[#f9c80e] to-[#ffe27a]" />

          <div className="p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              NJ permit help beyond practice questions
            </p>

            <h2
              id="beyond-quiz-title"
              className="mt-2 text-2xl font-black leading-tight text-[#08194A]"
            >
              The New Jersey permit test is only the first step
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-[#08194A]/72">
              Passing a New Jersey permit practice test is helpful, but families
              also need a way to track supervised driving hours and stay aligned
              with NJ GDL expectations. NJDrive50 is built to support that next stage.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-[#08194A]/80">
              <li className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2">
                Track supervised driving hours in one place.
              </li>
              <li className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2">
                Stay organized as your teen works through NJ requirements.
              </li>
              <li className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2">
                Turn practice into real progress for the New Jersey permit journey.
              </li>
            </ul>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={LANDING_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.18)] transition hover:-translate-y-[1px] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2"
              >
                Start NJDrive50
              </a>

              <a
                href="#practice-test"
                className="flex w-full items-center justify-center rounded-xl bg-[#08194A] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A] focus-visible:ring-offset-2"
              >
                Take Another Free Practice Round
              </a>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#08194A]/55">
              This page is a free New Jersey permit practice resource for study
              support and does not replace the official New Jersey Driver Manual.
            </p>
          </div>
        </section>

        <section
          className="mt-5 overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          aria-labelledby="faq-title"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

          <div className="p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
              Frequently asked questions
            </p>

            <h2
              id="faq-title"
              className="mt-2 text-2xl font-black leading-tight text-[#08194A]"
            >
              Common questions about this free NJ permit practice page
            </h2>

            <div className="mt-4 space-y-3">
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
          </div>
        </section>
      </main>
    </div>
  )
}