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
        Effective Date: May 26, 2026 — ORGANIC BRANDS LLC
      </p>

      {/* 1. Acceptance */}
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        By downloading or using NJDrive50, you agree to these Terms of Use. If
        you do not agree, you must discontinue use of the App.
      </p>

      {/* 2. Purpose */}
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Purpose of the App</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 helps users track supervised driving hours for New Jersey MVC
        requirements. The App does not guarantee legal compliance or driving
        safety. Parents and guardians are responsible for supervising teen
        drivers at all times.
      </p>

      {/* 3. User Responsibilities */}
      <h2 className="text-xl font-semibold mt-6 mb-2">3. User Responsibilities</h2>
      <ul className="list-disc ml-6 mb-4 text-sm leading-6 text-[#08194A]/75 space-y-1">
        <li>Provide accurate information when logging drives.</li>
        <li>Use the App only for lawful purposes.</li>
        <li>Not misuse, reverse‑engineer, or tamper with the App.</li>
        <li>Supervise teen drivers according to NJ MVC rules.</li>
      </ul>

      {/* 4. Subscriptions */}
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Subscriptions &amp; Payments</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        If you purchase a subscription, payments are processed through the Apple
        App Store or Google Play. Subscriptions automatically renew unless
        canceled. Refunds follow the policies of the respective app store.
      </p>

      <h3 className="text-lg font-semibold mt-4 mb-2">How to Cancel</h3>
      <div className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] divide-y divide-[#08194A]/8 mb-4">
        <div className="px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/40 mb-1">iOS</p>
          <p className="text-sm text-[#08194A]/75">
            Settings → Apple ID → Subscriptions → NJDrive50
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/40 mb-1">Android</p>
          <p className="text-sm text-[#08194A]/75">
            Google Play → Profile → Payments &amp; Subscriptions → Subscriptions → NJDrive50
          </p>
        </div>
      </div>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We cannot cancel subscriptions on your behalf.
      </p>

      {/* 5. Intellectual Property */}
      <h2 className="text-xl font-semibold mt-6 mb-2">5. Intellectual Property</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        All content, branding, design, and code in NJDrive50 are owned by
        ORGANIC BRANDS LLC and protected by copyright law. You may not copy,
        distribute, or modify the App without permission.
      </p>

      {/* 6. Disclaimer */}
      <h2 className="text-xl font-semibold mt-6 mb-2">6. Disclaimer of Warranties</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        NJDrive50 is provided "as is" without warranties of any kind. We do not
        guarantee the accuracy of logged data, compliance with NJ MVC
        requirements, or uninterrupted service.
      </p>

      {/* 7. Limitation of Liability */}
      <h2 className="text-xl font-semibold mt-6 mb-2">7. Limitation of Liability</h2>
      <div className="rounded-xl border border-[#08194A]/10 bg-[#FFF7DB] px-4 py-3 mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A6500] mb-1">
          Legal Notice
        </p>
        <p className="text-sm leading-6 text-[#08194A]/75">
          To the fullest extent permitted by law, ORGANIC BRANDS LLC is not
          liable for driving incidents, data loss, device issues, misuse of the
          App, or incorrect or incomplete driving logs.
        </p>
      </div>

      {/* 8. Termination */}
      <h2 className="text-xl font-semibold mt-6 mb-2">8. Termination</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We may suspend or terminate access to the App if Terms are violated,
        fraudulent activity is detected, or abuse occurs. You may stop using the
        App at any time by uninstalling it.
      </p>

      {/* 9. Changes */}
      <h2 className="text-xl font-semibold mt-6 mb-2">9. Changes to Terms</h2>
      <p className="mb-4 text-sm leading-6 text-[#08194A]/75">
        We may update these Terms periodically. Continued use after updates
        means you accept the revised terms.
      </p>

      {/* 10. Contact */}
      <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact</h2>
      <p className="mb-3 text-sm leading-6 text-[#08194A]/75">
        For legal or support inquiries:
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