import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

// ⭐ FUTURE: Replace this with real Google Play Billing check
async function getPurchaseStatus(_uid: string) {
  // For now, always return false (no purchase)
  // Later, this will check Firebase for hasPurchased or validate token
  return { hasPurchased: false }
}

// ⭐ Your developer UID (you will always bypass payment)
const DEV_UID = "YOUR_FIREBASE_UID_HERE"

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  // ───────────────────────────────────────────────
  // ⭐ 1. Developer bypass (works anywhere, offline)
  // ───────────────────────────────────────────────
  if (authUser?.uid === DEV_UID) {
    nav.resetTo("landingApp")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 2. User not logged in → Preview Mode
  // Show landingApp (NOT login)
  // ───────────────────────────────────────────────
  if (!authUser) {
    nav.resetTo("landingApp")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 3. User logged in → Check purchase status
  // (Google Play Billing token will update this later)
  // ───────────────────────────────────────────────
  const { hasPurchased } = await getPurchaseStatus(authUser.uid)

  // ⭐ 3A. Logged in but unpaid → Pricing
  if (!hasPurchased) {
    nav.resetTo("pricing")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 4. User purchased → Check profile
  // ───────────────────────────────────────────────
  if (!hasProfile()) {
    nav.resetTo("intro")
    return
  }

  const { isOnboarded } = getProfile()

  // ───────────────────────────────────────────────
  // ⭐ 5. Purchased but not onboarded → Intro
  // ───────────────────────────────────────────────
  if (!isOnboarded) {
    nav.resetTo("intro")
    return
  }

  // ───────────────────────────────────────────────
  // ⭐ 6. Fully onboarded → Home
  // ───────────────────────────────────────────────
  nav.resetTo("home")
}
