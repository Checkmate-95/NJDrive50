import { create } from "zustand"
import { Purchases, type CustomerInfo } from "@revenuecat/purchases-capacitor"
import {
  configureBilling,
  getCustomerInfo,
  hasPremium,
  identifyUser,
  resetUser,
} from "./revenuecat"

type BillingStatus = "idle" | "loading" | "ready" | "unavailable"

type PremiumState = {
  status: BillingStatus
  isPremium: boolean
  customerInfo: CustomerInfo | null
  setCustomerInfo: (info: CustomerInfo | null) => void
  signIn: (uid: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

let listenerId: string | null = null

export const usePremiumStore = create<PremiumState>((set, get) => ({
  status: "idle",
  isPremium: false,
  customerInfo: null,

  setCustomerInfo: (info) =>
    set({ customerInfo: info, isPremium: hasPremium(info) }),

  signIn: async (uid) => {
    set({ status: "loading" })

    const configured = await configureBilling()
    if (!configured) {
      set({ status: "unavailable", isPremium: false, customerInfo: null })
      return
    }

    try {
      const info = await identifyUser(uid)
      get().setCustomerInfo(info)

      if (!listenerId) {
        listenerId = await Purchases.addCustomerInfoUpdateListener((updated) => {
          get().setCustomerInfo(updated)
        })
      }

      set({ status: "ready" })
    } catch (error) {
      console.error("RevenueCat sign-in failed:", error)
      set({ status: "unavailable", isPremium: false })
    }
  },

  signOut: async () => {
    try {
      await resetUser()
    } catch (error) {
      console.error("RevenueCat sign-out failed:", error)
    }
    set({ status: "idle", isPremium: false, customerInfo: null })
  },

  refresh: async () => {
    try {
      const info = await getCustomerInfo()
      get().setCustomerInfo(info)
    } catch (error) {
      console.error("RevenueCat refresh failed:", error)
    }
  },
}))

// Use in components: const isPremium = usePremium()
export const usePremium = () => usePremiumStore((state) => state.isPremium)