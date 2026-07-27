import Link from "next/link"
import { siteConfig } from "@/app/siteConfig"



export default function PrivacyPage() {
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
            {siteConfig.appName} — Privacy Policy
          </h1>

          <p className="text-sm text-[#08194A]/70">
            Effective date: July 27, {siteConfig.meta.year} · {siteConfig.company}
          </p>
        </header>

        {/* Section 1 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Overview</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          {siteConfig.appName} ("we," "us," "our," or "the App") is operated by{" "}
          {siteConfig.company}. {siteConfig.appName} helps New Jersey teen drivers
          and parents track supervised driving hours required by the New Jersey
          Motor Vehicle Commission (MVC), including verifying night driving hours
          using precise location and local sunrise/sunset data. By using{" "}
          {siteConfig.appName}, you agree to this Privacy Policy.
        </p>

        {/* Section 2 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Information We Collect</h2>

        <h3 className="text-lg font-semibold mt-4 mb-2">A. Information You Provide</h3>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Profile information such as teen name, parent name, vehicle details, and an optional profile photo.</li>
          <li>Driving-log information including duration, miles, time of day, weather, and session metadata.</li>
          <li>Support messages you send to our team.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4 mb-2">B. Location Information</h3>
        <p className="text-sm leading-6 text-[#08194A]/75">
          {siteConfig.appName} uses precise GPS location while a drive is actively being tracked. Location data is used to:
        </p>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Verify whether a drive occurred during daylight or darkness.</li>
          <li>Calculate drive distance and mileage.</li>
          <li>Record starting and ending coordinates of each supervised drive.</li>
        </ul>

        <p className="text-sm leading-6 text-[#08194A]/75">
          Location is collected only while a drive is actively running in the app.
          We do not collect location when the app is closed and no drive is in progress.
        </p>

        <h3 className="text-lg font-semibold mt-4 mb-2">C. Automatically Collected Information</h3>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Device information (device type, OS version, app version).</li>
          <li>Crash and performance analytics.</li>
          <li>App usage data including driving history and profile data.</li>
        </ul>

        <h3 className="text-lg font-semibold mt-4 mb-2">D. Information We Do Not Collect</h3>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Advertising identifiers.</li>
          <li>Biometric data.</li>
          <li>Location data outside active drive sessions.</li>
        </ul>

        {/* Section 3 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">3. How We Use Information</h2>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Track supervised-driving progress.</li>
          <li>Display driving totals and milestones.</li>
          <li>Calculate route mileage.</li>
          <li>Improve app performance.</li>
          <li>Provide customer support.</li>
          <li>Comply with legal requirements.</li>
        </ul>

        <p className="text-sm leading-6 text-[#08194A]/75">
          We do not sell your data. We do not share your data with advertisers.
        </p>

        {/* Section 4 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">4. Third-Party Services</h2>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Google Firebase (Firestore & Storage)</li>
          <li>Firebase Crashlytics</li>
          <li>Firebase Analytics</li>
          <li>Google Maps Routes API</li>
          <li>Apple IAP & Google Play Billing</li>
        </ul>

        {/* Section 5 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">5. Storage and Retention</h2>
        <ul className="list-disc ml-6 text-sm leading-6 text-[#08194A]/75">
          <li>Profile and driving-log data stored in Firebase.</li>
          <li>Data retained until you request deletion.</li>
          <li>Crash analytics retained for 90 days.</li>
          <li>Support emails retained for 12 months.</li>
        </ul>

        {/* Section 6 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">6. Children's Privacy</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          {siteConfig.appName} is intended for teen drivers under parental supervision.
        </p>

        {/* Section 7 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">7. Your Rights and Deletion</h2>
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

        {/* Section 8 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to This Policy</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          Continued use of {siteConfig.appName} after updates means you accept the revised policy.
        </p>

        {/* Section 9 */}
        <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact Us</h2>
        <p className="text-sm leading-6 text-[#08194A]/75">
          For privacy questions or requests, contact:
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
