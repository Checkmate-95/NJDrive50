import { useNav } from "../state/navStore"

export default function TermsOfUse() {
  const { setScreen } = useNav()

  return (
    <div className="relative px-4 py-6 max-w-3xl mx-auto text-[#08194A]">

      {/* X Close Button — Go Back to Previous Screen */}
      <button
        onClick={() => {
          const stack = useNav.getState().stack
          const previous = stack.at(-2) ?? "settings"
          setScreen(previous)
        }}
        className="absolute right-4 top-4 text-[#08194A] text-2xl font-bold"
        aria-label="Close"
      >
        ×
      </button>

      <h1 className="text-2xl font-bold mb-4">NJDrive50 — Terms of Use</h1>
      <p className="text-sm text-[#0A1E5E]/70 mb-6">
        Effective Date: May 26, 2026 — ORGANIC BRANDS LLC
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
      <p className="mb-4">
        By downloading or using NJDrive50, you agree to these Terms of Use. If
        you do not agree, you must discontinue use of the App.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Purpose of the App</h2>
      <p className="mb-4">
        NJDrive50 helps users track supervised driving hours for New Jersey MVC
        requirements. The App does not guarantee legal compliance or driving
        safety. Parents and guardians are responsible for supervising teen
        drivers at all times.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. User Responsibilities</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Provide accurate information when logging drives.</li>
        <li>Use the App only for lawful purposes.</li>
        <li>Not misuse, reverse‑engineer, or tamper with the App.</li>
        <li>Supervise teen drivers according to NJ MVC rules.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Subscriptions & Payments</h2>
      <p className="mb-4">
        If you purchase a subscription, payments are processed through the Apple
        App Store or Google Play. Subscriptions automatically renew unless
        canceled. Refunds follow the policies of the respective app store.
      </p>

      <h3 className="text-lg font-semibold mt-4 mb-1">How to Cancel</h3>
      <ul className="list-disc ml-6 mb-4">
        <li>
          <strong>iOS:</strong> Settings → Apple ID → Subscriptions → NJDrive50
        </li>
        <li>
          <strong>Android:</strong> Google Play → Profile → Payments &amp;
          Subscriptions → Subscriptions → NJDrive50
        </li>
      </ul>
      <p className="mb-4">We cannot cancel subscriptions on your behalf.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Intellectual Property</h2>
      <p className="mb-4">
        All content, branding, design, and code in NJDrive50 are owned by
        ORGANIC BRANDS LLC and protected by copyright law. You may not copy,
        distribute, or modify the App without permission.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Disclaimer of Warranties</h2>
      <p className="mb-4">
        NJDrive50 is provided “as is” without warranties of any kind. We do not
        guarantee the accuracy of logged data, compliance with NJ MVC
        requirements, or uninterrupted service.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Limitation of Liability</h2>
      <p className="mb-4">
        To the fullest extent permitted by law, ORGANIC BRANDS LLC is not liable
        for driving incidents, data loss, device issues, misuse of the App, or
        incorrect or incomplete driving logs.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Termination</h2>
      <p className="mb-4">
        We may suspend or terminate access to the App if Terms are violated,
        fraudulent activity is detected, or abuse occurs. You may stop using the
        App at any time by uninstalling it.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Changes to Terms</h2>
      <p className="mb-4">
        We may update these Terms periodically. Continued use after updates
        means you accept the revised terms.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact</h2>
      <p className="mb-10">
        For legal or support inquiries: support@njdrive50.com
      </p>
    </div>
  )
}
