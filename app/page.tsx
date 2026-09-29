import type { Metadata } from "next"
import LandingPageClient from "./LandingPageClient"

const PAGE_URL = "https://www.njdrive50.com"
const OG_IMAGE_URL = `${PAGE_URL}/og-image.png`

const metaTitle =
  "NJDrive50 | New Jersey Driving Log App for Parents and Teen Drivers"

const metaDescription =
  "NJDrive50 is a New Jersey driving log app designed to help parents and teens organize supervised driving hours, nighttime progress, permit milestones, and BA-CSD preparation."

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  keywords: [
    "NJDrive50",
    "New Jersey driving log",
    "NJ supervised driving hours",
    "NJ teen driving requirements",
    "NJ driving log app",
    "track driving hours NJ",
    "night driving hours NJ",
    "NJ road test requirements",
    "New Jersey learner permit rules",
    "BA-CSD form",
    "NJ probationary license",
  ],
  authors: [{ name: "NJDrive50" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: "website",
    siteName: "NJDrive50",
    url: PAGE_URL,
    title: metaTitle,
    description: metaDescription,
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "NJDrive50 New Jersey driving log app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
    images: [
      {
        url: OG_IMAGE_URL,
        alt: "NJDrive50 New Jersey driving log app",
      },
    ],
  },
}

const faqs = [
  {
    question: "How many supervised driving hours are required in NJ?",
    answer:
      "For drivers under 21 with eligible permits issued on or after February 1, 2025, New Jersey requires at least 50 hours of supervised driving, including 10 hours during darkness, before a probationary license can be issued. Confirm current requirements directly with NJMVC.",
  },
  {
    question: "How many night driving hours are required in NJ?",
    answer:
      "For drivers under 21 with eligible permits issued on or after February 1, 2025, New Jersey requires at least 10 hours during darkness as part of the supervised driving requirement. Confirm current requirements directly with NJMVC.",
  },
  {
    question: "Who can supervise a teen driver in New Jersey?",
    answer:
      "New Jersey permit rules identify eligibility requirements for a supervising driver, including age and licensing experience requirements. A licensed driving-school instructor may also qualify. Confirm the current rules with NJMVC before driving.",
  },
  {
    question: "Do I have to submit my driving log to NJMVC?",
    answer:
      "NJMVC requires a signed Certification of Supervised Driving, Form BA-CSD, when applicable. Your personal driving-log records can help you organize the information needed to complete the form. Confirm current documentation requirements directly with NJMVC.",
  },
  {
    question: "How long do I have to wait before the NJ road test?",
    answer:
      "Drivers under 21 generally must satisfy the applicable permit waiting period before taking the NJ road test. NJDrive50 is designed to help families organize a permit issue date and related milestones, but NJMVC determines final eligibility.",
  },
  {
    question: "How can I track driving hours in NJ?",
    answer:
      "Keep a record of each supervised drive, including the date, duration, and any details your family needs. NJDrive50 is designed to organize logged driving time, daytime and nighttime progress, and permit milestones in one place.",
  },
  {
    question: "Will NJDrive50 work on Android?",
    answer:
      "Yes. NJDrive50 has a Google Play listing. An updated subscription version has been approved and is being prepared for release. Check Google Play for the version and price currently offered.",
  },
  {
    question: "What are the NJDrive50 subscription options?",
    answer:
      "The approved update offers $4.99 monthly and $29.99 yearly subscriptions through Google Play inside the Android app. Eligible new subscribers may receive a 7-day free trial on either plan. Google Play displays the offer, final price, billing period, and cancellation terms before you subscribe. The updated subscription version is pending release.",
  },
  {
    question: "How does the ZyroPro launch promotion work?",
    answer:
      "The promotion is not open yet, and the start and end dates will be posted on the ZyroPro Promotion Terms page before claims open. Once it opens, eligible yearly subscribers may submit a claim after any applicable free trial ends and the first $29.99 yearly payment succeeds. NJDrive50 manually reviews claims, and the first 50 valid eligible claims may receive one ZyroPro dashboard mount. Monthly plans do not qualify. Submission does not guarantee a mount.",
  },
]

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${PAGE_URL}#organization`,
      name: "NJDrive50",
      url: PAGE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${PAGE_URL}/njdrive50Logo6.png`,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${PAGE_URL}#softwareapp`,
      name: "NJDrive50",
      url: PAGE_URL,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Android",
      description:
        "NJDrive50 is a New Jersey driving log app designed to help families organize supervised driving hours, nighttime progress, permit dates, and BA-CSD preparation.",
      image: OG_IMAGE_URL,
      screenshot: OG_IMAGE_URL,
      areaServed: {
        "@type": "State",
        name: "New Jersey",
      },
      audience: {
        "@type": "PeopleAudience",
        audienceType: "New Jersey parents and teen drivers",
      },
      publisher: {
        "@id": `${PAGE_URL}#organization`,
      },
    },
    {
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
    },
    {
      "@type": "WebSite",
      "@id": `${PAGE_URL}#website`,
      name: "NJDrive50",
      url: PAGE_URL,
      description: metaDescription,
      inLanguage: "en-US",
      publisher: {
        "@id": `${PAGE_URL}#organization`,
      },
    },
    {
      "@type": "WebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: metaTitle,
      description: metaDescription,
      inLanguage: "en-US",
      isPartOf: {
        "@id": `${PAGE_URL}#website`,
      },
      about: {
        "@id": `${PAGE_URL}#softwareapp`,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: OG_IMAGE_URL,
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPageClient faqs={faqs} />
    </>
  )
}