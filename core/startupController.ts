// core/startupController.ts
import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

// Keep this false until Google Play Billing / entitlement verification is live.
async function getPurchaseStatus(_uid: string): Promise<{
  hasPurchased: boolean
}> {
  return { hasPurchased: false }
}

// Optional local-development convenience only.
// Do not treat this as production purchase security.
const DEV_UID = import.meta.env.VITE_DEV_UID ?? ""

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  // Development-only bypasses.
  if (import.meta.env.DEV || (DEV_UID && authUser?.uid === DEV_UID)) {
    nav.resetTo("home")
    return
  }

  // Guest / preview experience.
  if (!authUser) {
    nav.resetTo("landingApp")
    return
  }

  try {
    const { hasPurchased } = await getPurchaseStatus(authUser.uid)

    if (!hasPurchased) {
      nav.resetTo("pricing")
      return
    }

    const profile = getProfile()

    if (!hasProfile() || !profile.isOnboarded) {
      nav.resetTo("intro")
      return
    }

    nav.resetTo("home")
  } catch (error) {
    console.error("Unable to determine startup access:", error)

    // Fail closed: do not grant paid access when entitlement is unknown.
    nav.resetTo("pricing")
  }
}