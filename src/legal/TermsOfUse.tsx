import { useNav } from "../state/navStore"

export default function TermsOfUse() {
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

      <h1 className="text-2xl font-bold mb-4">NJDrive50 — Terms of Use</h1>
      <p className="text-sm text-[#0A1E5E]/70 mb-6">
        Effective Date: July 27, 2026 — ORGANIC BRANDS LLC
      </p>

      {/* 1. Acceptance of Terms */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        By downloading, accessing, or using NJDrive50, you agree to these Terms
        of Use. If you do not agree to these Terms, you must discontinue use of
        the App and related services.
      </p>

      {/* 2. Purpose of the App */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Purpose of the App</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 helps users track supervised driving hours for New Jersey MVC
        requirements. The App does not guarantee legal compliance, driving
        safety, eligibility for a permit or license, or acceptance of a driving
        log by any government agency. Parents and guardians remain responsible
        for supervising teen drivers at all times.
      </p>

      {/* 3. User Responsibilities */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. User Responsibilities</h2>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Provide accurate information when logging drives.</li>
        <li>Use the App only for lawful purposes.</li>
        <li>Do not misuse, reverse-engineer, interfere with, or tamper with the App.</li>
        <li>Supervise teen drivers in accordance with applicable New Jersey MVC rules.</li>
        <li>Review logged driving information before relying on it for official purposes.</li>
      </ul>

      {/* 4. Subscriptions and Payments */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Subscriptions and Payments</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        If you purchase a subscription, payment processing is handled through
        the Apple App Store or Google Play, as applicable. Subscription terms,
        prices, billing intervals, trials, and renewal terms are shown before
        purchase. Subscriptions renew automatically unless canceled before the
        next billing date. Refunds are subject to the policies of the store
        through which the purchase was made.
      </p>

      <h3 className="text-lg font-semibold mt-4 mb-2">How to Cancel</h3>

      <div className="flex flex-col rounded-xl border border-[#08194A]/10 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-[#F7F9FC]">
          <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#08194A]/45 mb-1">
            iOS
          </p>
          <p className="text-sm text-[#08194A]/75">
            Settings → Apple ID → Subscriptions → NJDrive50
          </p>
        </div>

        <div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#08194A]/10">
          <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#08194A]/45 mb-1">
            Android
          </p>
          <p className="text-sm text-[#08194A]/75">
            Google Play → Profile → Payments &amp; subscriptions → Subscriptions → NJDrive50
          </p>
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        Canceling stops future renewal charges, but access generally remains
        available through the end of the current billing period. Deleting the
        App does not by itself cancel an active subscription. We cannot cancel
        store-managed subscriptions on your behalf.
      </p>

      {/* 5. Intellectual Property */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Intellectual Property</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        All content, branding, design, software, and code in NJDrive50 are owned
        by or licensed to ORGANIC BRANDS LLC and are protected by applicable
        intellectual-property laws. You may not copy, distribute, modify, or
        create derivative works from the App without our prior written permission.
      </p>

      {/* 6. Disclaimer of Warranties */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Disclaimer of Warranties</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 is provided on an "as is" and "as available" basis without
        warranties of any kind, whether express or implied. We do not guarantee
        the accuracy of logged data, compliance with MVC requirements,
        uninterrupted service, or that the App will be error-free.
      </p>

      {/* 7. Limitation of Liability */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Limitation of Liability</h2>

      <div className="rounded-xl border border-[#f9c80e]/40 bg-[#FFF7DB] px-4 py-3 mb-4">
        <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#8A6500] mb-1">
          Legal Notice
        </p>
        <p className="text-sm leading-6 text-[#08194A]/75 mb-0">
          To the fullest extent permitted by law, ORGANIC BRANDS LLC is not
          liable for driving incidents, data loss, device issues, misuse of the
          App, or incorrect or incomplete driving logs.
        </p>
      </div>

      {/* 8. Termination */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Termination</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We may suspend or terminate access to NJDrive50 if these Terms are
        violated, fraudulent activity is detected, or abuse occurs. You may stop
        using the App at any time by uninstalling it and, where applicable,
        canceling any active subscription through the relevant app store.
      </p>

      {/* 9. Changes to These Terms */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Changes to These Terms</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We may update these Terms from time to time. Continued use of NJDrive50
        after an update becomes effective means you accept the revised Terms.
      </p>

      {/* 10. Contact */}
      <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact</h2>
      <p className="mb-2 text-sm leading-6 text-[#08194A]/75">
        For legal or support inquiries, contact:
      </p>
      <a
        href="mailto:support@njdrive50.com"
        className="inline-block text-sm font-bold text-[#08194A] underline underline-offset-2 mb-4"
      >
        support@njdrive50.com
      </a>

      <p className="mb-10">
        <a
          href="/privacy"
          className="text-sm font-bold text-[#08194A] underline underline-offset-2"
        >
          View the NJDrive50 Privacy Policy
        </a>
      </p>

    </div>
  )
}