import { Capacitor } from "@capacitor/core"
import {
  LOG_LEVEL,
  Purchases,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor"

// Must match the entitlement identifier in the RevenueCat dashboard.
export const PREMIUM_ENTITLEMENT_ID = "premium"

// Public SDK key (goog_... for Google Play, test_... for RevenueCat Test Store).
// Never put a RevenueCat secret key (sk_...) in the app.
const API_KEY = import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined

let configurePromise: Promise<boolean> | null = null

export function isBillingSupported(): boolean {
  return Capacitor.getPlatform() === "android" && Boolean(API_KEY)
}

export function configureBilling(): Promise<boolean> {
  if (configurePromise) return configurePromise

  configurePromise = (async () => {
    if (!isBillingSupported()) return false

    try {
      if (import.meta.env.DEV) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
      }
      await Purchases.configure({ apiKey: API_KEY as string })
      return true
    } catch (error) {
      console.error("RevenueCat configure failed:", error)
      configurePromise = null
      return false
    }
  })()

  return configurePromise
}

export function hasPremium(info: CustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements.active[PREMIUM_ENTITLEMENT_ID])
}

// Call after Firebase sign-in so purchases follow the account across devices.
export async function identifyUser(uid: string): Promise<CustomerInfo | null> {
  if (!(await configureBilling())) return null
  const { customerInfo } = await Purchases.logIn({ appUserID: uid })
  return customerInfo
}

// Call on Firebase sign-out.
export async function resetUser(): Promise<void> {
  if (!(await configureBilling())) return
  const { isAnonymous } = await Purchases.isAnonymous()
  if (!isAnonymous) {
    await Purchases.logOut()
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!(await configureBilling())) return null
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!(await configureBilling())) return null
  const offerings = await Purchases.getOfferings()
  return offerings.current ?? null
}

export type PurchaseOutcome =
  | { status: "purchased"; customerInfo: CustomerInfo }
  | { status: "cancelled" }
  | { status: "error"; message: string }

export async function purchasePackage(aPackage: PurchasesPackage): Promise<PurchaseOutcome> {
  if (!(await configureBilling())) {
    return { status: "error", message: "Purchases are not available on this device." }
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage })
    return { status: "purchased", customerInfo }
  } catch (error) {
    const e = error as { userCancelled?: boolean; code?: string | number; message?: string }
    if (e?.userCancelled || String(e?.code) === "1") {
      return { status: "cancelled" }
    }
    console.error("RevenueCat purchase failed:", error)
    return {
      status: "error",
      message: e?.message ?? "The purchase could not be completed. Please try again.",
    }
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!(await configureBilling())) return null
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo
}