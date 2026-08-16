import { useNav } from "../state/navStore"

export default function PrivacyPolicy() {
  const { goBack } = useNav()

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-6 text-[#08194A]">
      <button
        type="button"
        onClick={() => goBack()}
        className="absolute right-4 top-4 text-2xl font-bold text-[#08194A]"
        aria-label="Close"
      >
        ×
      </button>

      <h1 className="mb-4 text-2xl font-bold">NJDrive50 — Privacy Policy</h1>
      <p className="mb-6 text-sm text-[#0A1E5E]/70">
        Effective Date: August 16, 2026 — ORGANIC BRANDS LLC
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">1. Overview</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 (&quot;we,&quot; &quot;our,&quot; or &quot;the App&quot;) is
        operated by ORGANIC BRANDS LLC. NJDrive50 helps New Jersey teen drivers
        and parents track supervised driving sessions, mileage, and verified day
        and night driving hours related to New Jersey permit and licensing
        requirements. This Privacy Policy explains what information we collect,
        how we use it, how it may be stored or shared, and what choices and
        rights you have regarding your information.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">
        2. Information We Collect
      </h2>

      <h3 className="mb-1 mt-4 text-lg font-semibold">
        A. Information You Provide
      </h3>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          Account and profile information, such as teen driver name, parent or
          guardian name, email address, vehicle details, and optional profile
          photo.
        </li>
        <li>
          Driving log information you create or save, including session notes,
          totals, summaries, and related metadata.
        </li>
        <li>Messages or support requests you send to us.</li>
      </ul>

      <h3 className="mb-1 mt-4 text-lg font-semibold">
        B. Location Information
      </h3>
      <p className="mb-2 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 uses precise location information during an active drive
        session that you start in the app. Location information is used to
        verify whether driving occurred during daylight or darkness, calculate
        mileage and route-related drive data, and record starting coordinates,
        ending coordinates, and route points for saved drives.
      </p>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          Verify whether a drive occurred during daylight or darkness using
          local sunrise and sunset conditions at your location.
        </li>
        <li>Calculate drive distance, route mileage, and trip history.</li>
        <li>
          Record starting coordinates, ending coordinates, and route points for
          active and saved drives.
        </li>
      </ul>

      <h3 className="mb-1 mt-4 text-lg font-semibold">
        C. Background Location Access
      </h3>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        During an active drive session that you start in NJDrive50, the app may
        continue receiving precise location data even when the app is minimized
        or not visible. This helps NJDrive50 maintain accurate drive duration,
        mileage, route history, and day/night driving calculations. Location
        tracking is intended to stop when the active drive session ends. You can
        change location permissions in your device settings, but disabling
        location access may limit or prevent drive recording and verification
        features.
      </p>

      <h3 className="mb-1 mt-4 text-lg font-semibold">
        D. Automatically Collected Information
      </h3>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          Device and app information, such as device model, operating system,
          app version, and basic diagnostics.
        </li>
        <li>Crash, error, and performance information.</li>
        <li>
          Usage information related to app activity, driving logs, and account
          interactions.
        </li>
      </ul>

      <h3 className="mb-1 mt-4 text-lg font-semibold">
        E. Payment and Subscription Information
      </h3>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        If you purchase a subscription or paid feature, payment transactions are
        processed by Apple App Store or Google Play, as applicable. We do not
        store your full payment card number. We may receive limited transaction
        details, such as purchase status, subscription status, and related
        billing identifiers needed to manage your subscription.
      </p>

      <h3 className="mb-1 mt-4 text-lg font-semibold">
        F. What We Do Not Collect
      </h3>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>No biometric data.</li>
        <li>No advertising identifiers for third-party advertising.</li>
        <li>
          No location collection when no active drive session is running,
          subject to limited technical caching or platform behavior outside our
          direct control.
        </li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">
        3. How We Use Your Information
      </h2>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          Track supervised driving progress, including verified day and night
          driving hours.
        </li>
        <li>Record active drives, mileage, route history, and summaries.</li>
        <li>
          Continue recording an active drive while tracking remains enabled,
          including when the app is minimized during an active session.
        </li>
        <li>Display totals, milestones, history, and compliance progress.</li>
        <li>Improve app performance, stability, and reliability.</li>
        <li>Provide support and respond to user requests.</li>
        <li>
          Detect, prevent, or investigate fraud, misuse, abuse, or technical
          issues.
        </li>
        <li>Comply with legal, regulatory, and app store requirements.</li>
      </ul>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We do not sell your personal data. We do not use your data for
        third-party advertising. We do not disclose your personal data to
        government authorities unless required by law, legal process, or valid
        regulatory request.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">
        4. How Information May Be Shared
      </h2>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          With service providers and infrastructure partners that help us
          operate the app, store data, process subscriptions, monitor crashes,
          and provide technical functionality.
        </li>
        <li>
          With Apple or Google, as needed to process subscriptions and in-app
          purchases.
        </li>
        <li>
          With legal authorities or other parties when required to comply with
          law, protect rights or safety, investigate misuse, or enforce our
          terms.
        </li>
        <li>
          In connection with a merger, acquisition, financing, reorganization,
          or sale of assets, subject to appropriate confidentiality and lawful
          handling.
        </li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">
        5. Third-Party Services We Use
      </h2>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          Google Firebase, including Firestore and Cloud Storage, to store
          account, profile, and driving-log data.
        </li>
        <li>Firebase Crashlytics for crash reporting and diagnostics.</li>
        <li>Google Analytics for Firebase for analytics and usage trends.</li>
        <li>
          Google Maps Platform or related routing services to calculate route
          distance and mileage.
        </li>
        <li>
          Apple In-App Purchases or Google Play Billing for subscription and
          purchase processing.
        </li>
      </ul>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        These third parties may process data on our behalf or under their own
        terms and privacy policies, depending on the service involved.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">
        6. Data Storage, Security, and Retention
      </h2>
      <ul className="mb-4 ml-6 list-disc space-y-1 text-sm leading-6 text-[#08194A]/75">
        <li>
          Profile information, account information, driving logs, route
          coordinates, and related app data may be stored in secure cloud
          services associated with your account.
        </li>
        <li>
          We use reasonable administrative, technical, and organizational
          measures designed to protect personal information from unauthorized
          access, use, disclosure, alteration, or destruction.
        </li>
        <li>
          Driving-log and account data is generally retained until you delete
          specific data or request account deletion, subject to limited
          retention for legal, security, fraud-prevention, backup, audit, or
          dispute-related purposes.
        </li>
        <li>Crash analytics data may be retained for up to 90 days.</li>
        <li>Support emails or support requests may be retained for up to 12 months.</li>
      </ul>

      <h2 className="mb-2 mt-6 text-xl font-semibold">7. Children&apos;s Privacy</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 is designed for teen drivers under parent or guardian
        supervision. A parent or guardian is expected to create, manage, or
        supervise the teen&apos;s use of the app where required. We aim to handle
        personal information in a manner consistent with applicable privacy
        principles and legal obligations, including laws that may apply to
        minors and family-directed services.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">8. Your Choices and Rights</h2>
      <p className="mb-3 text-sm leading-6 text-[#08194A]/75">
        Depending on your location and applicable law, you may have rights to
        access, correct, export, or delete certain personal information. You may
        also control location permissions through your device settings and stop
        location collection by ending an active drive session or disabling
        location access.
      </p>
      <div className="mb-4 flex flex-col gap-2">
        <a
          href="/delete-data"
          className="flex items-center justify-between rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
        >
          <span>Delete My Data</span>
          <span className="text-[#08194A]/40">›</span>
        </a>
        <a
          href="/delete-account"
          className="flex items-center justify-between rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
        >
          <span>Delete My Account</span>
          <span className="text-[#08194A]/40">›</span>
        </a>
      </div>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        If your app allows account creation, users should have both an in-app
        option and an external web resource to request account deletion and
        associated data deletion.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">9. Changes to This Policy</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We may update this Privacy Policy from time to time. If we make material
        changes, we may update the effective date above and, where appropriate,
        provide additional notice inside the app or by other reasonable means.
      </p>

      <h2 className="mb-2 mt-6 text-xl font-semibold">10. Contact Us</h2>
      <p className="mb-2 text-sm leading-6 text-[#08194A]/75">
        For privacy questions, deletion requests, or support inquiries, contact:
      </p>
      <a
        href="mailto:support@njdrive50.com"
        className="mb-10 inline-block text-sm font-bold text-[#08194A] underline underline-offset-2"
      >
        support@njdrive50.com
      </a>
    </div>
  )
}