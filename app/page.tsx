import type { Metadata } from "next"
import LandingPageClient from "./LandingPageClient"

const PAGE_URL = "https://www.njdrive50.com"
const OG_IMAGE_URL = `${PAGE_URL}/og-image.png`
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.njdrive50.app"

const metaTitle =
  "NJDrive50 | New Jersey 50-Hour Driving Log App for NJ Supervised Driving Hours"

const metaDescription =
  "NJDrive50 is a New Jersey driving log app for parents and teens. Track 50 supervised driving hours, 10 night driving hours, permit milestones, and NJMVC Form BA-CSD progress. View plans, then download the app to start a 7-day free trial."

export const metadata: Metadata = {
  title: metaTitle,
  description: metaDescription,
  keywords: [
    "NJDrive50",
    "New Jersey 50-hour driving log",
    "NJ supervised driving hours",
    "NJ teen driving requirements",
    "NJ driving log app",
    "track driving hours NJ",
    "NJ MVC driving log",
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
      "No. What New Jersey requires at licensure is a signed Certification of Supervised Driving (NJMVC Form BA-CSD), not submission of your app log itself. NJDrive50 helps you maintain an accurate New Jersey 50-hour driving record so completing that certification is easier.",
  },
  {
    question: "How long do I have to wait before the NJ road test?",
    answer:
      "Drivers under 21 must generally wait at least 6 months from permit issuance before taking the NJ road test and applying for a probationary license. NJDrive50 helps families track the permit issue date, road test eligibility timeline, and related milestones.",
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
      "NJDrive50 offers a 7-day free trial inside the app. After the trial, subscriptions are $4.99 per month or $39.99 per year and are managed through Google Play.",
  },
]

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
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
      offers: [
        {
          "@type": "Offer",
          name: "Monthly Plan",
          price: "4.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: GOOGLE_PLAY_URL,
          category: "Subscription",
        },
        {
          "@type": "Offer",
          name: "Annual Plan",
          price: "39.99",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: GOOGLE_PLAY_URL,
          category: "Subscription",
        },
      ],
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
      isPartOf: {
        "@type": "WebSite",
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