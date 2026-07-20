import type { Metadata } from "next"
import PricingPageClient from "./PricingPageClient"

const PAGE_URL = "https://www.njdrive50.com/pricing"

const metaTitle =
  "NJDrive50 Pricing | New Jersey Driving Log App Free Trial, Monthly & Annual Plans"

const metaDescription =
  "See NJDrive50 pricing for New Jersey families. Download the app to start a 7-day free trial, then choose monthly or annual billing to track the NJ 50-hour driving log, night hours, permit milestones, and road test readiness."

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: metaTitle,
    description: metaDescription,
  },
  twitter: {
    card: "summary",
    title: metaTitle,
    description: metaDescription,
  },
}

const pricingFaqs = [
  {
    question: "Does the free trial apply to both plans?",
    answer:
      "Yes. Families can start a 7-day free trial inside the NJDrive50 app before monthly or annual billing begins.",
  },
  {
    question: "Are there different features in each plan?",
    answer:
      "No. Monthly and annual include the same NJDrive50 features. The difference is only billing frequency and total cost.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Subscriptions and cancellations are managed through your Google Play Store or App Store subscription settings.",
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

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webPageSchema, faqPageSchema]).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />
      <PricingPageClient pricingFaqs={pricingFaqs} />
    </>
  )
}