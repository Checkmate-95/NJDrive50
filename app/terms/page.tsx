import Link from "next/link"
import { siteConfig } from "@/app/siteConfig"

// Update this whenever the Terms change.
const LAST_UPDATED = "September 29, 2026"

const h2Class = "text-xl font-semibold mt-6 mb-2"
const pClass = "text-sm leading-6 text-[#08194A]/75"
const ulClass = "list-disc ml-6 text-sm leading-6 text-[#08194A]/75"
const textLinkClass =
  "inline-block mt-2 text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
const rowLinkClass =
  "flex justify-between items-center px-4 py-3 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] font-bold text-sm"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
        <header className="mb-6">
          <Link
            href={siteConfig.routes.home}
            className="inline-block text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
          >
            ← Back to Home
          </Link>

          <h1 className="mt-4 text-2xl font-extrabold">
            {siteConfig.appName} — Terms of Use
          </h1>

          <p className="text-sm text-[#08194A]/70">
            Last updated: {LAST_UPDATED} · {siteConfig.company}
          </p>
        </header>

        {/* Section 1 */}
        <h2 className={h2Class}>1. Acceptance of Terms</h2>
        <p className={pClass}>
          {siteConfig.appName} is operated by {siteConfig.company}. By using{" "}
          {siteConfig.appName}, you agree to these Terms of Use and our Privacy
          Policy. If you do not agree, you must discontinue use of the app and
          may request deletion of your data.
        </p>

        {/* Section 2 */}
        <h2 className={h2Class}>2. Purpose of the App</h2>
        <p className={pClass}>
          {siteConfig.appName} helps New Jersey teen drivers and parents
          organize supervised driving records related to requirements set by the
          New Jersey Motor Vehicle Commission (MVC). The app is an organizational
          tool. It is not affiliated with the MVC or any government agency, and
          it does not determine licensing or road-test eligibility. Requirements
          can change, so confirm current requirements directly with the MVC.
        </p>

        {/* Section 3 */}
        <h2 className={h2Class}>3. User Responsibilities</h2>
        <ul className={ulClass}>
          <li>Permit holders must drive with an eligible supervising driver as required by NJMVC.</li>
          <li>Users must provide accurate profile and driving information.</li>
          <li>
            Users are responsible for reviewing their driving records for
            accuracy, including before signing or submitting any MVC form.
          </li>
          <li>Users are responsible for maintaining the security of their account.</li>
        </ul>

        {/* Section 4 */}
        <h2 className={h2Class}>4. Safe Use</h2>
        <p className={pClass}>
          Do not operate or look at the app while driving. The supervising adult
          or another passenger should handle the app, and you must always follow
          traffic laws and drive safely. {siteConfig.appName} is not a substitute
          for attention, judgment, or supervision.
        </p>

        {/* Section 5 */}
        <h2 className={h2Class}>5. Location and Driving Data</h2>
        <p className={pClass}>
          Drive duration, distance, route, and day or night classification are
          calculated from device location and time data and are estimates. GPS
          signal, device settings, battery optimization, and other factors can
          affect accuracy or cause tracking to stop. {siteConfig.appName} does
          not guarantee that its records will be accepted by the MVC or any other
          authority.
        </p>

        {/* Section 6 */}
        <h2 className={h2Class}>6. Informational Content</h2>
        <p className={pClass}>
          Practice tests, checklists, rules summaries, and any automated answers
          in the app are provided for general information and study only. They
          may be incomplete, out of date, or inaccurate, and they are not legal
          advice. Confirm all requirements and rules with the MVC.
        </p>

        {/* Section 7 */}
        <h2 className={h2Class}>7. Subscriptions &amp; Billing</h2>
        <p className={pClass}>
  {siteConfig.appName} is free to download. When the approved subscription
  update is released, premium access will be offered through monthly and
  yearly subscriptions purchased and billed through Google Play. Eligible
  new subscribers may receive a 7-day free trial. Google Play shows your
  eligible offer, the final price, the billing period, and cancellation
  terms before you subscribe.
</p>
        <p className={`${pClass} mt-2`}>
          Once available, subscriptions renew automatically until you cancel them in Google
          Play. If a trial applies, you are charged when the trial ends unless
          you cancel first. Uninstalling the app or deleting your account does
          not cancel a subscription; you must cancel it in Google Play. Billing,
          cancellation, and refund requests are handled through Google Play under
          its policies and applicable law, and we do not process payments on this
          website. Current plan details are shown on our Pricing page.
        </p>

        <Link href="/pricing" className={textLinkClass}>
          View Pricing →
        </Link>

        {/* Section 8 */}
        <h2 className={h2Class}>8. Promotions</h2>
        <p className={pClass}>
          From time to time we may offer promotions, such as the ZyroPro launch
          promotion. Each promotion is governed by its own terms and is not part
          of any subscription or subscription price. Google Play does not
          sponsor or fulfill our promotions.
        </p>

        <Link href="/zyropro-promotion-terms" className={textLinkClass}>
          View ZyroPro Promotion Terms →
        </Link>

        {/* Section 9 */}
        <h2 className={h2Class}>9. Data &amp; Privacy</h2>
        <p className={pClass}>
          Your use of {siteConfig.appName} is also governed by our Privacy Policy.
        </p>

        <Link href={siteConfig.routes.privacy} className={textLinkClass}>
          View Privacy Policy →
        </Link>

        {/* Section 10 */}
        <h2 className={h2Class}>10. Account &amp; Data Deletion</h2>
        <p className={pClass}>
          You may delete specific data or your entire account at any time.
          Deleting your account does not cancel a Google Play subscription;
          cancel it separately in Google Play.
        </p>

        <div className="mt-4 space-y-3">
          <Link href={siteConfig.routes.deleteData} className={rowLinkClass}>
            <span>Delete My Data</span>
            <span className="text-[#08194A]/40">›</span>
          </Link>

          <Link href={siteConfig.routes.deleteAccount} className={rowLinkClass}>
            <span>Delete My Account</span>
            <span className="text-[#08194A]/40">›</span>
          </Link>
        </div>

        {/* Section 11 */}
        <h2 className={h2Class}>11. Disclaimers and Limitation of Liability</h2>
        <p className={pClass}>
          To the fullest extent permitted by law, {siteConfig.appName} is
          provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, and {siteConfig.company} and its officers,
          directors, employees, contractors, and affiliates are not liable for
          indirect, incidental, special, consequential, or punitive damages, or
          for any loss arising from inaccurate or missing records, unavailable
          tracking, or your reliance on the app or its content. Nothing in these
          Terms excludes or limits liability that cannot be excluded or limited
          under applicable law.
        </p>

        {/* Section 12 */}
        <h2 className={h2Class}>12. Suspension and Termination</h2>
        <p className={pClass}>
          We may suspend or end access to {siteConfig.appName} if you violate
          these Terms, misuse the service, or if needed to protect the service,
          other users, or comply with law. You may stop using the app at any
          time.
        </p>

        {/* Section 13 */}
        <h2 className={h2Class}>13. Governing Law</h2>
        <p className={pClass}>
          These Terms are governed by the laws of the State of New Jersey,
          without regard to its conflict-of-law principles.
        </p>

        {/* Section 14 */}
        <h2 className={h2Class}>14. Changes to These Terms</h2>
        <p className={pClass}>
          We may update these Terms periodically and will post the updated
          version on this page with a new date. Continued use of{" "}
          {siteConfig.appName} after updates means you accept the revised Terms.
        </p>

        {/* Section 15 */}
        <h2 className={h2Class}>15. Contact Us</h2>
        <p className={pClass}>For questions about these Terms, contact:</p>

        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
        >
          {siteConfig.contactEmail}
        </a>

        <footer className="mt-10 text-center text-xs text-[#08194A]/50">
          © {siteConfig.meta.year} {siteConfig.company} · {siteConfig.appName}
        </footer>
      </div>
    </main>
  )
}