import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"
import { Capacitor } from "@capacitor/core"

// ⭐ REAL purchase check (kept ON)
async function getPurchaseStatus(_uid: string) {
  return { hasPurchased: false }   // stays false until billing is added
}

// ⭐ Your developer UID
const DEV_UID = "YOUR_FIREBASE_UID_HERE"

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  // ───────────────────────────────────────────────
  // ⭐ 1. DEV BYPASS: Your Firebase UID
  // ───────────────────────────────────────────────
  if (authUser?.uid === DEV_UID) {
    nav.resetTo("home")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 2. DEV BYPASS: Desktop/Web Preview
  // ───────────────────────────────────────────────
  if (!Capacitor.isNativePlatform()) {
    nav.resetTo("home")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 3. DEV BYPASS: Android Debug Build
  // Works in Vite/React dev mode AND Capacitor dev mode
  // ───────────────────────────────────────────────
  if (import.meta.env.DEV) {
    nav.resetTo("home")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 4. User not logged in → Preview Mode
  // ───────────────────────────────────────────────
  if (!authUser) {
    nav.resetTo("landingApp")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 5. User logged in → Check purchase status
  // ───────────────────────────────────────────────
  const { hasPurchased } = await getPurchaseStatus(authUser.uid)

  if (!hasPurchased) {
    nav.resetTo("pricing")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 6. Purchased → Check profile
  // ───────────────────────────────────────────────
  if (!hasProfile()) {
    nav.resetTo("intro")
    return
  }

  const { isOnboarded } = getProfile()

  if (!isOnboarded) {
    nav.resetTo("intro")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 7. Fully onboarded → Home
  // ───────────────────────────────────────────────
  nav.resetTo("home")
}
