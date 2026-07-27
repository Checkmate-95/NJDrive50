import { useNav } from "../state/navStore"

export default function PrivacyPolicy() {
  const { goBack } = useNav()

  return (
    <div className="relative px-4 py-6 max-w-3xl mx-auto text-[#08194A]">

      {/* Close Button */}
      <button
        onClick={() => goBack()}
        className="absolute right-4 top-4 text-[#08194A] text-2xl font-bold"
        aria-label="Close"
      >
        ×
      </button>

      <h1 className="text-2xl font-bold mb-4">NJDrive50 — Privacy Policy</h1>
      <p className="text-sm text-[#0A1E5E]/70 mb-6">
        Effective Date: July 27, 2026 — ORGANIC BRANDS LLC
      </p>

      {/* 1. Overview */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Overview</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 ("we," "our," "the App") is operated by ORGANIC BRANDS LLC.
        We help New Jersey teen drivers and parents track supervised driving
        hours required by the NJ Motor Vehicle Commission (MVC), including
        verifying night driving hours using precise location and local
        sunrise/sunset data. We are committed to protecting your privacy and
        being transparent about how your information is used. By using
        NJDrive50, you agree to this Privacy Policy.
      </p>

      {/* 2. Information We Collect */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Information We Collect</h2>

      <h3 className="text-lg font-semibold mt-4 mb-1">A. Information You Provide</h3>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Profile information such as teen name, parent name, car details, and optional profile photo.</li>
        <li>Driving logs including duration, miles, time of day, weather, and session metadata.</li>
        <li>Support messages you send to our team.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-1">B. Location Information</h3>
      <p className="mb-2 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 uses precise GPS location while a drive is actively being
        tracked. Location data is used to:
      </p>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Verify whether a drive occurred during daylight or darkness, based on local sunrise and sunset times at your location.</li>
        <li>Calculate drive distance and route mileage.</li>
        <li>Record the starting and ending coordinates of each supervised drive.</li>
      </ul>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        Location is collected only while a drive is actively running in the
        app, with an active notification indicating tracking is in progress.
        We do not collect location when the app is closed and no drive is in
        progress. Location data associated with a saved drive is stored with
        that drive record until you delete it or your account.
      </p>

      <h3 className="text-lg font-semibold mt-4 mb-1">C. Automatically Collected Information</h3>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Device information such as device type, OS version, and app version.</li>
        <li>Crash and performance analytics.</li>
        <li>App usage data including driving history and profile data.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-1">D. What We Do Not Collect</h3>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>No advertising identifiers.</li>
        <li>No biometric data.</li>
        <li>No location data outside of active drive sessions.</li>
      </ul>

      {/* 3. How We Use Your Information */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. How We Use Your Information</h2>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Track supervised driving progress, including verified day and night hours.</li>
        <li>Display accurate totals and milestones.</li>
        <li>Calculate route mileage and drive distance.</li>
        <li>Improve app performance and reliability.</li>
        <li>Provide customer support.</li>
        <li>Comply with app store and legal requirements.</li>
      </ul>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We do not sell your data. We do not share your data with advertisers. We
        do not share your data with government agencies unless legally required.
      </p>

      {/* 4. Third-Party Services */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Third‑Party Services We Use</h2>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Google Firebase (Firestore and Cloud Storage) — securely stores account, profile, and driving-log data.</li>
        <li>Google Firebase Crashlytics — crash reporting.</li>
        <li>Google Analytics for Firebase — anonymous usage analytics.</li>
        <li>Google Maps Platform (Routes API) — calculates drive distance and mileage.</li>
        <li>Apple In‑App Purchases / Google Play Billing — subscription processing.</li>
      </ul>

      {/* 5. Data Storage & Retention */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Storage &amp; Retention</h2>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Profile information, driving logs, route coordinates, and account data are stored securely in Google Firebase (Firestore and Cloud Storage), associated with your account.</li>
        <li>Driving-log and account data is retained until you request deletion of specific data or your full account, as described in Section 7.</li>
        <li>Crash analytics data is retained for up to 90 days.</li>
        <li>Support emails are retained for up to 12 months.</li>
      </ul>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        You may delete specific data or your entire account at any time via
        Settings → Account &amp; Profile → Delete My Data, or using the links
        below.
      </p>

      {/* 6. Children's Privacy */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Children's Privacy</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 is intended for teen drivers under parental supervision.
        Parents or guardians must create and manage the teen's profile. We
        follow applicable privacy principles relating to children and personal
        information, including COPPA, CCPA, and GDPR principles where applicable.
      </p>

      {/* 7. Your Rights */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Your Rights</h2>
      <p className="mb-3 text-sm leading-6 text-[#08194A]/75">
        Depending on your location, you may have the right to access, correct,
        or delete your data. Use the options below to exercise these rights.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        <a
          href="/delete-data"
          className="flex items-center justify-between rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] hover:bg-[#EEF3FA] transition"
        >
          <span>Delete My Data</span>
          <span className="text-[#08194A]/40">›</span>
        </a>
        <a
          href="/delete-account"
          className="flex items-center justify-between rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] hover:bg-[#EEF3FA] transition"
        >
          <span>Delete My Account</span>
          <span className="text-[#08194A]/40">›</span>
        </a>
      </div>

      {/* 8. Changes to This Policy */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Changes to This Policy</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We may update this Privacy Policy periodically. Continued use of
        NJDrive50 after updates means you accept the revised policy.
      </p>

      {/* 9. Contact Us */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact Us</h2>
      <p className="mb-2 text-sm leading-6 text-[#08194A]/75">
        For privacy questions or requests:
      </p>
      <a
        href="mailto:support@njdrive50.com"
        className="inline-block text-sm font-bold text-[#08194A] underline underline-offset-2 mb-10"
      >
        support@njdrive50.com
      </a>

    </div>
  )
}