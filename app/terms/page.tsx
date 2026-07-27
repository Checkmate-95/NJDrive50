import Link from "next/link"
import { siteConfig } from "@/app/siteConfig"



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
            Effective date: July 27, {siteConfig.meta.year} · {siteConfig.company}
          </p>
        </header>

        {/* Section 1 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          By using {siteConfig.appName}, you agree to these Terms of Use and our Privacy Policy.
          If you do not agree, you must discontinue use of the app and request deletion of your data.
        </p>

        {/* Section 2 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Purpose of the App</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          {siteConfig.appName} helps New Jersey teen drivers and parents track supervised driving
          hours required by the New Jersey Motor Vehicle Commission (MVC). The app is not affiliated
          with the MVC or any government agency.
        </p>

        {/* Section 3 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">3. User Responsibilities</h2>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Parents or guardians must supervise teen drivers.</li>
          <li>Users must provide accurate profile and driving information.</li>
          <li>Users are responsible for maintaining the security of their account.</li>
        </ul>

        {/* Section 4 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Subscriptions & Billing</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          Subscription payments are processed through Apple In‑App Purchases and Google Play Billing.
          All billing inquiries must be handled through the respective app store.
        </p>

        {/* Section 5 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Data & Privacy</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          Your use of {siteConfig.appName} is also governed by our Privacy Policy.
        </p>

        <Link
          href={siteConfig.routes.privacy}
          className="inline-block mt-2 text-sm font-bold text-[#0A1E5E] underline underline-offset-2"
        >
          View Privacy Policy →
        </Link>

        {/* Section 6 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Account & Data Deletion</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          You may delete specific data or your entire account at any time.
        </p>

        <div className="mt-4 space-y-3">
          <Link
            href={siteConfig.routes.deleteData}
            className="flex justify-between items-center px-4 py-3 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] font-bold text-sm"
          >
            <span>Delete My Data</span>
            <span className="text-[#08194A]/40">›</span>
          </Link>

          <Link
            href={siteConfig.routes.deleteAccount}
            className="flex justify-between items-center px-4 py-3 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] font-bold text-sm"
          >
            <span>Delete My Account</span>
            <span className="text-[#08194A]/40">›</span>
          </Link>
        </div>

        {/* Section 7 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes to These Terms</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          We may update these Terms periodically. Continued use of {siteConfig.appName} after updates
          means you accept the revised Terms.
        </p>

        {/* Section 8 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact Us</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          For questions about these Terms, contact:
        </p>

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
