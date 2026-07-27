// app/settings/page.tsx
import Link from "next/link"
import { siteConfig } from "@/app/siteConfig"


export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 pb-20 pt-3 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">

        {/* ── Header ── */}
        <header className="rounded-2xl border border-[#08194A]/8 bg-white px-4 py-4 shadow-sm">
          <Link
            href={siteConfig.routes.home}
            className="mb-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/70 transition hover:bg-[#EEF3FA]"
          >
            ← Back to Home
          </Link>

          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#08194A]/40">
              Account
            </p>
            <span className="rounded-full border border-[#16A34A]/15 bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
              Public
            </span>
          </div>

          <h1 className="text-lg font-extrabold tracking-tight leading-tight text-[#08194A]">
            Settings
          </h1>
          <p className="mt-1 text-xs leading-5 text-[#08194A]/55">
            Manage your {siteConfig.appName} account, review our policies, or
            contact support — no login required.
          </p>
        </header>

        <div className="mt-3 space-y-3">

          {/* ── Account Management ── */}
          <CompactCard eyebrow="Account" title="Manage Your Account">
            <p className="mb-2 text-xs leading-5 text-[#08194A]/60">
              Most account actions are managed directly inside the{" "}
              {siteConfig.appName} app, where you're signed in.
            </p>
            <div className="flex flex-col gap-2">
              <InfoRow
                title="Update profile info"
                description={`Open ${siteConfig.appName} → Settings → Account & Profile → Manage Profile to update teen or parent details.`}
              />
              <InfoRow
                title="Change your password"
                description={`Open ${siteConfig.appName} → Settings → Account & Profile → Change Password.`}
              />
              <InfoRow
                title="Sign out"
                description={`Open ${siteConfig.appName} → Settings → Account & Profile → Sign Out.`}
              />
            </div>
          </CompactCard>

          {/* ── Data & Account Deletion ── */}
          <CompactCard eyebrow="Deletion" title="Delete Data or Account" tone="danger">
            <p className="mb-2 text-xs leading-5 text-[#08194A]/60">
              You can request deletion of specific data or your entire
              account at any time, without needing to log in.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={siteConfig.routes.deleteData}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700 transition hover:bg-red-100"
              >
                Delete My Data
              </Link>
              <Link
                href={siteConfig.routes.deleteAccount}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700 transition hover:bg-red-100"
              >
                Delete My Account
              </Link>
            </div>
          </CompactCard>

          {/* ── Legal ── */}
          <CompactCard eyebrow="Legal" title="Privacy & Terms">
            <div className="divide-y divide-[#08194A]/8 overflow-hidden rounded-xl border border-[#08194A]/10 bg-[#F7F9FC]">
              <Link
                href={siteConfig.routes.privacy}
                className="flex h-11 w-full items-center justify-between px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Privacy Policy</span>
                <span className="text-[#08194A]/30">›</span>
              </Link>
              <Link
                href={siteConfig.routes.terms}
                className="flex h-11 w-full items-center justify-between px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Terms of Use</span>
                <span className="text-[#08194A]/30">›</span>
              </Link>
              <Link
                href={siteConfig.routes.deleteAccount}
                className="flex h-11 w-full items-center justify-between px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Account & Data Deletion</span>
                <span className="text-[#08194A]/30">›</span>
              </Link>
            </div>
          </CompactCard>

          {/* ── Support ── */}
          <CompactCard eyebrow="Support" title="Help & Contact">
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
            >
              {siteConfig.contactEmail}
            </a>
            <p className="mt-2 text-center text-xs leading-5 text-[#08194A]/45">
              {siteConfig.company} · {siteConfig.appName}
            </p>
          </CompactCard>

          {/* ── Get the App ── */}
          <CompactCard eyebrow="App" title="Manage on Mobile">
            <p className="mb-2 text-xs leading-5 text-[#08194A]/60">
              For full account management, drive log history, and reminders,
              use the {siteConfig.appName} app.
            </p>
            <Link
              href={siteConfig.routes.pricing}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-[#08194A] px-4 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E]"
            >
              View Plans
            </Link>
          </CompactCard>

        </div>
      </div>
    </main>
  )
}

// ── CompactCard ──────────────────────────────────────────────────────────────
function CompactCard({
  eyebrow,
  title,
  children,
  tone = "default",
}: {
  eyebrow?: string
  title: string
  children: React.ReactNode
  tone?: "default" | "danger"
}) {
  return (
    <section
      className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${
        tone === "danger" ? "border-red-200" : "border-[#08194A]/10"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2">
        {eyebrow && (
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
              tone === "danger" ? "text-red-500" : "text-[#08194A]/40"
            }`}
          >
            {eyebrow}
          </span>
        )}
        <span className="text-[10px] text-[#08194A]/20">·</span>
        <h2 className="text-sm font-extrabold tracking-tight text-[#08194A]">
          {title}
        </h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

// ── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2.5">
      <p className="text-sm font-bold text-[#08194A]">{title}</p>
      <p className="mt-0.5 text-xs leading-5 text-[#08194A]/55">
        {description}
      </p>
    </div>
  )
}