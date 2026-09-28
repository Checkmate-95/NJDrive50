import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

const SPONSOR_LEGAL_NAME = "Organic Brands LLC"
const SUPPORT_EMAIL = "support@njdrive50.com"

const PROMOTION_START = "September 30, 2026 at 12:00 AM Eastern Time"
const PROMOTION_END = "March 31, 2027 at 11:59 PM Eastern Time"
const EFFECTIVE_DATE = "September 30, 2026"

const MAX_CLAIMS = 50
const YEARLY_PRICE = "$29.99"
const VERIFICATION_RESPONSE_DAYS = 7
const RETENTION_DAYS = 90

// ZyroPro is a brand owned by Organic Brands LLC.
const ZYROPRO_IS_THIRD_PARTY = false

const PAGE_URL = "https://www.njdrive50.com/zyropro-promotion-terms"
const PAGE_TITLE = "ZyroPro Launch Promotion Terms | NJDrive50"
const PAGE_DESCRIPTION =
  "Official terms for the NJDrive50 ZyroPro dashboard mount launch promotion for eligible yearly subscribers."

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

const linkClasses =
  "font-semibold text-[#0A1E5E] underline underline-offset-2 hover:text-[#08194A]"

const supportLink = (
  <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClasses}>
    {SUPPORT_EMAIL}
  </a>
)

type TermSection = {
  title: string
  paragraphs: ReactNode[]
}

const sections: TermSection[] = [
  {
    title: "Sponsor and contact",
    paragraphs: [
      <>
        The NJDrive50 ZyroPro Dashboard Mount Launch Promotion (the
        “Promotion”) is sponsored, offered, and fulfilled by{" "}
        {SPONSOR_LEGAL_NAME}, doing business as NJDrive50 (“NJDrive50,” “we,”
        “us,” or “our”).
      </>,
      <>
        For questions about the Promotion or a claim, contact {supportLink}.
        Please include the email address and Google Play Order ID used with
        your claim.
      </>,
    ],
  },
  {
    title: "Google Play is not a sponsor",
    paragraphs: [
      <>
        Google Play is not a sponsor of this Promotion and does not administer,
        fulfill, or ship the promotional item. Google Play processes NJDrive50
        subscription purchases under its own terms and policies. Questions
        about the Promotion must be directed to NJDrive50, not Google.
      </>,
    ],
  },
  {
    title: "Promotion Period",
    paragraphs: [
      <>
        The Promotion begins at {PROMOTION_START} and ends at {PROMOTION_END},
        or when NJDrive50 has received {MAX_CLAIMS} valid eligible claims,
        whichever occurs first (the “Promotion Period”).
      </>,
      <>
        When the Promotion Period ends, NJDrive50 will display an “ended”
        notice and stop accepting new claims. Claims submitted after the
        Promotion Period ends are not eligible.
      </>,
    ],
  },
  {
    title: "Eligibility",
    paragraphs: [
      <>
        To be eligible, a claimant must: (a) be a legal resident of the United
        States and at least 18 years old at the time of claim; (b) hold an
        eligible NJDrive50 yearly subscription purchased through Google Play;
        and (c) provide a valid, deliverable U.S. shipping address.
      </>,
      <>
        Employees, contractors, officers, directors, and agents of{" "}
        {SPONSOR_LEGAL_NAME}, and their immediate family and household members,
        are not eligible.
      </>,
      <>
        No purchase is required to download or use the free features of the
        NJDrive50 app. Eligibility for this Promotion, however, requires an
        eligible NJDrive50 yearly subscription and compliance with these
        Terms. The Promotion is void where prohibited by law.
      </>,
    ],
  },
  {
    title: "How to qualify and claim",
    paragraphs: [
      <>
        To qualify, an eligible person must: (a) hold an active eligible NJDrive50
        yearly subscription purchased through Google Play; (b) complete the
        applicable 7-day free trial; (c) have the {YEARLY_PRICE} yearly
        subscription payment successfully processed; and (d) submit a complete
        and valid claim through the official{" "}
        <Link href="/claim-zyropro" className={linkClasses}>
          NJDrive50 ZyroPro claim page
        </Link>{" "}
        during the Promotion Period, including the required attestation of
        U.S. legal residency, age, and subscription ownership.
      </>,
      <>
        Monthly NJDrive50 subscriptions are not eligible for this Promotion,
        including monthly subscriptions in a free trial.
      </>,
      <>
        A claim is not eligible merely because a person starts a trial, starts
        checkout, subscribes, or submits a claim. Incomplete or inaccurate
        claims are not eligible.
      </>,
    ],
  },
  {
    title: `First ${MAX_CLAIMS} valid eligible claims`,
    paragraphs: [
      <>
        Subject to verification, the first {MAX_CLAIMS} valid eligible claims
        received by NJDrive50 during the Promotion Period qualify to receive
        one ZyroPro dashboard mount. Receipt order is determined by NJDrive50’s
        server-side timestamp when a complete claim is received, not by a
        claimant’s device time, checkout time, subscription start time, or
        trial start time. A complete claim that is later verified as valid and
        eligible keeps its original receipt order.
      </>,
      <>
        Submitting a claim does not guarantee qualification or fulfillment. An
        incomplete, invalid, ineligible, duplicate, or fraudulent claim does
        not reserve a promotional mount or hold a place among the first{" "}
        {MAX_CLAIMS} valid eligible claims. NJDrive50 will move to the next
        valid eligible claim in receipt order.
      </>,
    ],
  },
  {
    title: "Claim limits",
    paragraphs: [
      <>
        Limit one ZyroPro dashboard mount per person, qualifying paid Google
        Play yearly subscription transaction, email address, shipping address,
        and household. NJDrive50 may reject claims that attempt to evade this
        limit or otherwise abuse the Promotion.
      </>,
    ],
  },
  {
    title: "Promotional item",
    paragraphs: [
      <>
        Each qualifying claimant may receive one ZyroPro dashboard mount at no
        additional charge, including standard U.S. shipping. The mount is a
        limited launch promotion and is not part of the NJDrive50 subscription
        service, subscription price, or any recurring subscription benefit.
      </>,
      <>
        The promotional item has no cash value, is not redeemable for cash or
        account credit, and may not be sold, transferred, or exchanged. If the
        ZyroPro dashboard mount becomes unavailable, NJDrive50 may substitute
        an item of equal or greater retail value, except where prohibited by
        law.
      </>,
    ],
  },
  {
    title: "Shipping and fulfillment",
    paragraphs: [
      <>
        NJDrive50 ships qualifying items only to the verified U.S. shipping
        address provided with the claim and will contact qualifying claimants
        at the email address provided with the claim. Delivery timing is an
        estimate only and may vary based on verification, inventory, carrier
        conditions, and other factors outside NJDrive50’s reasonable control.
      </>,
      <>
        Claimants are responsible for providing an accurate, deliverable
        address. Except as required by applicable law, NJDrive50 is not
        responsible for shipments that are lost, late, misdirected,
        undeliverable, stolen, or damaged after delivery to the carrier, or
        for failed delivery caused by an incorrect or incomplete address.
      </>,
    ],
  },
  {
    title: "Refunds, chargebacks, and cancellations",
    paragraphs: [
      <>
        NJDrive50 subscriptions are billed and managed through Google Play.
        Cancellation, refund, and billing matters for the subscription are
        subject to the subscription terms presented at purchase, applicable
        law, and Google Play’s applicable policies and purchase-management
        processes.
      </>,
      <>
        Turning off auto-renewal does not by itself affect eligibility, because
        the paid yearly period remains active. However, if the qualifying
        yearly payment is refunded, reversed, charged back, or fails before
        the promotional item ships, the claim is void and NJDrive50 may cancel
        fulfillment.
      </>,
      <>
        If a refund, reversal, or chargeback of the qualifying payment occurs
        after the item ships, the claimant is not required to return the item,
        and receipt of the item does not create any cash refund, account-credit,
        or exchange right.
      </>,
      <>
        NJDrive50 may reasonably delay approval or shipment while it confirms
        payment status. Nothing in these Terms limits any non-waivable consumer
        rights under applicable law.
      </>,
    ],
  },
  {
    title: "Verification and disqualification",
    paragraphs: [
      <>
        NJDrive50 manually reviews claims and may verify the Google Play Order
        ID, subscription status, completed trial period, successful payment,
        refund or reversal status, identity, residency, shipping address,
        duplicate submissions, and compliance with these Terms. NJDrive50 may
        request reasonable verification information by email; failure to
        respond within {VERIFICATION_RESPONSE_DAYS} days of the request may
        result in disqualification.
      </>,
      <>
        NJDrive50 may disqualify anyone who tampers with the claim process,
        uses automated or deceptive methods, submits false or misleading
        information, attempts multiple claims in violation of these Terms, or
        otherwise interferes with the fair operation of the Promotion.
        NJDrive50’s decisions regarding claim validity, eligibility,
        verification, receipt order, and fulfillment are final to the extent
        permitted by law.
      </>,
    ],
  },
  {
    title: "Privacy and data retention",
    paragraphs: [
      <>
        NJDrive50 uses information submitted with a claim, including name,
        email address, Google Play Order ID, and shipping address, to
        administer and verify the Promotion, communicate about a claim, prevent
        fraud, and fulfill approved shipments. This information is handled
        under the{" "}
        <Link href="/privacy" className={linkClasses}>
          NJDrive50 Privacy Policy
        </Link>
        .
      </>,
      <>
        Claim records and related verification information will be deleted or
        de-identified within {RETENTION_DAYS} days after the Promotion ends or
        fulfillment is completed, whichever occurs later, unless a longer
        period is reasonably necessary to resolve a dispute, prevent fraud,
        comply with law, enforce these Terms, or meet accounting and
        recordkeeping obligations.
      </>,
    ],
  },
  {
    title: "Changes, suspension, or termination",
    paragraphs: [
      <>
        NJDrive50 may modify, suspend, or terminate the Promotion if fraud,
        technical failure, legal requirements, or circumstances beyond its
        reasonable control impair the administration, security, fairness, or
        proper operation of the Promotion. NJDrive50 will not apply a material
        change retroactively to a claim that has already qualified, except
        where necessary to comply with law, address fraud, or correct an error.
        Changes will be posted on this page with an updated effective date.
      </>,
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      <>
        To the fullest extent permitted by law, {SPONSOR_LEGAL_NAME} and its
        officers, directors, employees, contractors, affiliates, suppliers, and
        agents are not liable for indirect, incidental, special, consequential,
        or punitive damages arising from or related to the Promotion, the claim
        process, shipping, or use of the promotional item. Nothing in these
        Terms excludes or limits liability that cannot be excluded or limited
        under applicable law.
      </>,
    ],
  },
  {
        title: "Non-affiliation and brand ownership",
    paragraphs: [
      <>
        NJDrive50 is an independent organizational tool. NJDrive50 is not
        affiliated with, endorsed by, or sponsored by the New Jersey Motor
        Vehicle Commission or any government agency.
      </>,
      ZYROPRO_IS_THIRD_PARTY ? (
        <>
          ZyroPro is a trademark of its respective owner. The owner of the
          ZyroPro brand is not a sponsor or administrator of this Promotion.
        </>
      ) : (
                <>ZyroPro is a brand of {SPONSOR_LEGAL_NAME}.</>
      ),
      <>Google Play is a trademark of Google LLC.</>,
    ],
  },
  {
    title: "Governing law",
    paragraphs: [
      <>
        These Terms are governed by the laws of the State of New Jersey,
        without regard to its conflict-of-law principles. By submitting a
        claim, you agree to these Terms.
      </>,
    ],
  },
]

export default function ZyroProPromotionTermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#08194A] sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-lg text-sm font-bold text-[#0A1E5E] underline underline-offset-4 transition hover:text-[#08194A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08194A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F9FC]"
        >
          ← Back to NJDrive50
        </Link>

        <article className="mt-5 rounded-3xl border border-[#08194A]/10 bg-white px-5 py-7 shadow-[0_12px_32px_rgba(8,25,74,0.08)] sm:px-10 sm:py-10">
          <header className="border-b border-[#08194A]/10 pb-6">
            <div className="inline-flex rounded-full bg-[#F9C80E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08194A]">
              Official promotion terms
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              NJDrive50 ZyroPro Dashboard Mount Launch Promotion
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#08194A]/60">
              Effective date: {EFFECTIVE_DATE}
            </p>

            <div className="mt-5 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-4 text-sm leading-6 text-[#08194A]/80">
              <span className="font-bold text-[#08194A]">Quick summary:</span>{" "}
              The first {MAX_CLAIMS} valid eligible claims received between{" "}
              {PROMOTION_START} and {PROMOTION_END} may receive one ZyroPro
              dashboard mount. You must be a U.S. legal resident age 18 or
              older, your 7-day free trial must end, and your {YEARLY_PRICE}{" "}
              yearly payment must successfully process before you submit a
              claim. Yearly subscriptions only; monthly subscriptions are not
              eligible. Google Play is not a sponsor of this Promotion.
            </div>
          </header>

          <div className="mt-8 space-y-8 text-base leading-7 text-[#08194A]/80">
            {sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`term-${index + 1}`}>
                <h2
                  id={`term-${index + 1}`}
                  className="text-xl font-extrabold text-[#08194A]"
                >
                  {index + 1}. {section.title}
                </h2>

                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="mt-3">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>

        <section className="mt-6 rounded-2xl bg-[#08194A] px-5 py-5 text-white shadow-[0_12px_32px_rgba(8,25,74,0.16)] sm:px-6">
          <h2 className="text-lg font-extrabold">Ready to submit a claim?</h2>

          <p className="mt-2 text-sm leading-7 text-white/70">
            Submit only after your 7-day free trial has ended and your{" "}
            {YEARLY_PRICE} yearly subscription payment has successfully
            processed.
          </p>

          <Link
            href="/claim-zyropro"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#F9C80E] px-5 py-3 text-sm font-extrabold text-[#08194A] shadow-sm transition hover:bg-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]"
          >
            Go to the claim page
          </Link>
        </section>

        <p className="mt-8 text-center text-xs leading-6 text-[#08194A]/50">
          Last updated: {EFFECTIVE_DATE}
        </p>
      </div>
    </main>
  )
}