import type { Metadata } from "next"
import Link from "next/link"

const PAGE_URL = "https://www.njdrive50.com/zyropro-promotion-terms"

export const metadata: Metadata = {
  title: "ZyroPro Launch Promotion Terms | NJDrive50",
  description:
    "Terms for the NJDrive50 ZyroPro dashboard mount launch promotion for eligible yearly subscribers.",
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: "ZyroPro Launch Promotion Terms | NJDrive50",
    description:
      "Terms for the NJDrive50 ZyroPro dashboard mount launch promotion for eligible yearly subscribers.",
  },
  twitter: {
    card: "summary",
    title: "ZyroPro Launch Promotion Terms | NJDrive50",
    description:
      "Terms for the NJDrive50 ZyroPro dashboard mount launch promotion for eligible yearly subscribers.",
  },
}

const terms = [
  {
    title: "1. Promotion sponsor",
    content: (
      <>
        The NJDrive50 ZyroPro dashboard mount launch promotion is offered and
        fulfilled by NJDrive50. Google Play is not a sponsor of this promotion
        and does not administer, fulfill, or ship the promotional item.
      </>
    ),
  },
  {
    title: "2. Promotional item",
    content: (
      <>
        Subject to these terms, an eligible claimant may receive one ZyroPro
        dashboard mount at no additional charge. The dashboard mount is a
        limited promotional bonus and is not part of the NJDrive50 subscription
        service.
      </>
    ),
  },
  {
    title: "3. Limited quantity",
    content: (
      <>
        This promotion is limited to the first 50 eligible claims approved by
        NJDrive50, while supplies last. No separate claim deadline applies;
        the promotion ends when 50 eligible claims have been approved or when
        available promotional inventory is exhausted, whichever happens first.
      </>
    ),
  },
  {
    title: "4. Eligible subscription",
    content: (
      <>
        To be eligible, a claimant must have an eligible NJDrive50 yearly
        subscription purchased through Google Play. The seven-day free trial
        must have ended, and the $29.99 yearly subscription payment must have
        successfully processed before a claim can be approved.
      </>
    ),
  },
  {
    title: "5. Who may claim",
    content: (
      <>
        Claimants must be at least 18 years old, be the holder of the eligible
        yearly NJDrive50 subscription, and provide a valid U.S. shipping
        address. This promotion is available only for shipping addresses in the
        United States.
      </>
    ),
  },
  {
    title: "6. How to submit a claim",
    content: (
      <>
        After the eligible yearly payment has successfully processed, the
        subscription holder may submit a claim through the NJDrive50 ZyroPro
        claim page. A valid Google Play Order ID, contact information, and U.S.
        shipping address are required. One promotional mount may be claimed per
        verified eligible Google Play yearly order.
      </>
    ),
  },
  {
    title: "7. Verification and approval",
    content: (
      <>
        Submitting a claim does not guarantee approval or shipment. NJDrive50
        manually reviews each claim and may verify the Google Play Order ID,
        yearly subscription status, completed trial period, successful yearly
        payment, available promotional inventory, duplicate claims, refund or
        reversal status, and shipping information before approving fulfillment.
      </>
    ),
  },
  {
    title: "8. Ineligible claims",
    content: (
      <>
        NJDrive50 may reject claims that are incomplete, inaccurate,
        fraudulent, duplicate, submitted with an invalid or ineligible Google
        Play order, associated with a monthly plan, submitted before the yearly
        payment is successfully processed, refunded, reversed, chargebacked,
        outside the available inventory, or otherwise not compliant with these
        terms.
      </>
    ),
  },
  {
    title: "9. Subscription cancellation and refunds",
    content: (
      <>
        NJDrive50 subscriptions are managed through Google Play. A subscriber
        may cancel through Google Play at any time. Cancellation generally
        stops a future renewal and does not itself create a refund for the
        current paid billing period; Google Play policies and applicable law
        control cancellation and refund eligibility. An order that is refunded,
        reversed, or otherwise invalid before NJDrive50 approves the promotion
        claim is not eligible for the promotional mount.
      </>
    ),
  },
  {
    title: "10. Shipping and fulfillment",
    content: (
      <>
        Approved mounts are shipped only to the approved U.S. address supplied
        in the claim. NJDrive50 will contact approved claimants using the email
        address provided with the claim. Delivery timing may vary based on
        verification, inventory, and shipping conditions. NJDrive50 is not
        responsible for delays or failed delivery caused by an incorrect,
        incomplete, or undeliverable address supplied by the claimant.
      </>
    ),
  },
  {
    title: "11. Changes or end of promotion",
    content: (
      <>
        NJDrive50 may modify, suspend, or end this promotion when reasonably
        necessary to address fraud, technical issues, inventory availability,
        legal requirements, or circumstances beyond its reasonable control.
        Any changes will not affect claims already approved by NJDrive50 except
        where required to prevent fraud or comply with law.
      </>
    ),
  },
  {
    title: "12. Privacy",
    content: (
      <>
        NJDrive50 uses information submitted with a claim—including name,
        email address, Google Play Order ID, and shipping address—to review
        eligibility, communicate about the promotion, and fulfill an approved
        mount shipment. For more information, review the{" "}
        <Link
          href="/privacy"
          className="font-semibold text-[#38BDF8] underline underline-offset-2 hover:text-white"
        >
          NJDrive50 Privacy Policy
        </Link>
        .
      </>
    ),
  },
  {
    title: "13. No affiliation with NJMVC",
    content: (
      <>
        NJDrive50 is an independent organizational tool. NJDrive50 is not
        affiliated with, endorsed by, or sponsored by the New Jersey Motor
        Vehicle Commission.
      </>
    ),
  },
  {
    title: "14. General terms",
    content: (
      <>
        This promotion is void where prohibited. By submitting a claim, you
        agree to these terms. NJDrive50&apos;s decisions regarding eligibility,
        verification, and fulfillment are final, subject to applicable law.
      </>
    ),
  },
]

export default function ZyroProPromotionTermsPage() {
  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-white sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-lg text-sm font-bold text-[#38BDF8] underline underline-offset-4 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
        >
          ← Back to NJDrive50
        </Link>

        <header className="mt-5 rounded-3xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 px-5 py-7 sm:px-8 sm:py-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#38BDF8]">
            Launch promotion
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            ZyroPro Dashboard Mount Promotion Terms
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            Please read these terms before submitting a claim for the NJDrive50
            ZyroPro dashboard mount launch promotion.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/70">
            <p>
              <span className="font-bold text-white">Quick summary:</span> The
              first 50 approved eligible yearly NJDrive50 claims may receive one
              ZyroPro dashboard mount, while supplies last. Your seven-day free
              trial must end and the $29.99 yearly payment must successfully
              process before a claim can be approved.
            </p>
          </div>
        </header>

        <section className="mt-6 space-y-4">
          {terms.map(({ title, content }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 sm:px-6"
            >
              <h2 className="text-base font-extrabold text-white">{title}</h2>
              <div className="mt-3 text-sm leading-7 text-white/68">
                {content}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-extrabold text-white">
            Ready to submit a claim?
          </h2>

          <p className="mt-2 text-sm leading-7 text-white/70">
            Submit only after your seven-day free trial has ended and your
            $29.99 yearly subscription payment has successfully processed.
          </p>

          <Link
            href="/claim-zyropro"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#38BDF8] px-5 py-3 text-sm font-extrabold text-[#020617] shadow-[0_18px_40px_rgba(56,189,248,0.25)] transition hover:bg-[#0EA5E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
          >
            Go to the claim page
          </Link>
        </section>

        <p className="mt-8 text-center text-xs leading-6 text-white/40">
          Last updated: September 24, 2026
        </p>
      </div>
    </main>
  )
}