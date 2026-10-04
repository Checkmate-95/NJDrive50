// src/screens/Paywall.tsx
import { useEffect, useState } from "react"
import type { PurchasesOffering, PurchasesPackage } from "@revenuecat/purchases-capacitor"
import {
  getCurrentOffering,
  hasPremium,
  purchasePackage,
  restorePurchases,
} from "../billing/revenuecat"
import { usePremiumStore } from "../billing/premiumStore"

type PaywallProps = {
  onClose: () => void
  onUnlocked?: () => void
}

type PlanKey = "annual" | "monthly"

const TERMS_URL = "https://www.njdrive50.com/terms"
const PRIVACY_URL = "https://www.njdrive50.com/privacy"
const MANAGE_URL = "https://play.google.com/store/account/subscriptions"

const PREMIUM_FEATURES = [
  "New Jersey 50-hour driving log tracking",
  "Automatic night-hours tracking",
  "Progress dashboard for parents and teens",
  "Road-test readiness support",
  "Permit milestone reminders",
  "BA-CSD preparation support",
]

const PERIOD_WORD: Record<PlanKey, string> = {
  annual: "year",
  monthly: "month",
}

type FreePhaseShape = {
  defaultOption?: { freePhase?: { billingPeriod?: { iso8601?: string } } | null } | null
}

// Free-trial length in days, or null if Google is not offering a trial to
// this user for this package (e.g. they already used their one trial).
function getTrialDays(aPackage: PurchasesPackage | null): number | null {
  if (!aPackage) return null
  const period = (aPackage.product as unknown as FreePhaseShape).defaultOption?.freePhase
    ?.billingPeriod?.iso8601
  if (!period) return null
  const days = /^P(\d+)D$/.exec(period)
  if (days) return Number(days[1])
  const weeks = /^P(\d+)W$/.exec(period)
  if (weeks) return Number(weeks[1]) * 7
  return null
}

function planLine(aPackage: PurchasesPackage, plan: PlanKey): string {
  const trialDays = getTrialDays(aPackage)
  const price = `${aPackage.product.priceString}/${PERIOD_WORD[plan]}`
  return trialDays ? `${trialDays}-day free trial, then ${price}` : price
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function Paywall({ onClose, onUnlocked }: PaywallProps) {
  const setCustomerInfo = usePremiumStore((state) => state.setCustomerInfo)

  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null)
  const [selected, setSelected] = useState<PlanKey>("annual")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    getCurrentOffering()
      .then((current) => {
        if (!cancelled) setOffering(current)
      })
      .catch((error) => {
        console.error("Failed to load offerings:", error)
        if (!cancelled) setOffering(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const annual = offering?.annual ?? null
  const monthly = offering?.monthly ?? null
  const selectedPackage = selected === "annual" ? annual : monthly
  const selectedTrialDays = getTrialDays(selectedPackage)

  const handlePurchase = async () => {
    if (!selectedPackage || busy) return
    setBusy("purchase")
    setMessage("")

    const result = await purchasePackage(selectedPackage)

    if (result.status === "purchased") {
      setCustomerInfo(result.customerInfo)
      if (hasPremium(result.customerInfo)) {
        onUnlocked?.()
        onClose()
      } else {
        setMessage("Purchase received. Premium access is still activating. Please try Restore purchases in a moment.")
      }
    } else if (result.status === "error") {
      setMessage(result.message)
    }

    setBusy(null)
  }

  const handleRestore = async () => {
    if (busy) return
    setBusy("restore")
    setMessage("")

    try {
      const info = await restorePurchases()
      setCustomerInfo(info)
      if (hasPremium(info)) {
        onUnlocked?.()
        onClose()
      } else {
        setMessage("No active NJDrive50 subscription was found for this Google account.")
      }
    } catch (error) {
      console.error("Restore failed:", error)
      setMessage("Restore failed. Please check your connection and try again.")
    }

    setBusy(null)
  }

  const optionClasses = (active: boolean) =>
    `w-full rounded-2xl border-2 px-4 py-4 text-left transition ${
      active ? "border-[#F9C80E] bg-[#FFF8DB]" : "border-[#08194A]/10 bg-white"
    }`

  const disclosure = selectedPackage
    ? selectedTrialDays
      ? `After the ${selectedTrialDays}-day free trial, ${selectedPackage.product.priceString} is charged to your Google Play account and renews every ${PERIOD_WORD[selected]}. Cancel before the trial ends and you will not be charged. `
      : `${selectedPackage.product.priceString} is charged to your Google Play account and renews every ${PERIOD_WORD[selected]}. `
    : ""

  return (
    <main className="min-h-dvh bg-[#F7F9FC] px-4 py-6 text-[#08194A]">
      <div className="mx-auto w-full max-w-md space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold text-[#08194A]/70 underline underline-offset-2"
        >
          ← Not now
        </button>

        <header className="rounded-3xl bg-[#08194A] px-5 py-6 text-white shadow-[0_16px_40px_rgba(8,25,74,0.22)]">
          <div className="inline-flex rounded-full bg-[#F9C80E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#08194A]">
            NJDrive50 Premium
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
            Unlock every tool for the road test
          </h1>
          <ul className="mt-4 space-y-2">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                <span className="mt-0.5 text-[#F9C80E]">
                  <CheckIcon />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </header>

        {loading ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-[#08194A]/70">
            Loading plans...
          </div>
        ) : !annual && !monthly ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            Subscription plans are not available right now. Check your connection and make sure
            you are signed in to Google Play, then try again.
          </div>
        ) : (
          <div className="space-y-3">
            {annual ? (
              <button type="button" onClick={() => setSelected("annual")} className={optionClasses(selected === "annual")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-extrabold">Yearly</p>
                    <p className="text-sm text-[#08194A]/70">{planLine(annual, "annual")}</p>
                  </div>
                  <span className="rounded-full bg-[#08194A] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
                    Best value
                  </span>
                </div>
              </button>
            ) : null}

            {monthly ? (
              <button type="button" onClick={() => setSelected("monthly")} className={optionClasses(selected === "monthly")}>
                <p className="text-base font-extrabold">Monthly</p>
                <p className="text-sm text-[#08194A]/70">{planLine(monthly, "monthly")}</p>
              </button>
            ) : null}
          </div>
        )}

        {message ? (
          <div role="alert" className="rounded-xl border border-[#08194A]/10 bg-white px-3 py-3 text-sm text-[#08194A]/80">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handlePurchase()}
          disabled={!selectedPackage || busy !== null}
          className="min-h-[52px] w-full rounded-2xl bg-[#08194A] px-4 py-3 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "purchase"
            ? "Opening Google Play..."
            : selectedTrialDays
              ? "Start free trial"
              : "Subscribe"}
        </button>

        <button
          type="button"
          onClick={() => void handleRestore()}
          disabled={busy !== null}
          className="w-full text-center text-sm font-bold text-[#08194A]/70 underline underline-offset-2 disabled:opacity-50"
        >
          {busy === "restore" ? "Restoring..." : "Restore purchases"}
        </button>

        <p className="text-xs leading-5 text-[#08194A]/60">
          {disclosure}
          Subscriptions renew automatically unless canceled before the end of the current period.
          Free trial availability depends on your Google Play account eligibility. Manage or cancel anytime in Google Play.
        </p>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-[#08194A]/70">
          <button type="button" onClick={() => openExternal(TERMS_URL)} className="underline underline-offset-2">
            Terms of Use
          </button>
          <button type="button" onClick={() => openExternal(PRIVACY_URL)} className="underline underline-offset-2">
            Privacy Policy
          </button>
          <button type="button" onClick={() => openExternal(MANAGE_URL)} className="underline underline-offset-2">
            Manage subscription
          </button>
        </div>
      </div>
    </main>
  )
}