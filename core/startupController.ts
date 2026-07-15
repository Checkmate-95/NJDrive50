// core/startupController.ts
import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

// Keep this false until Google Play Billing / entitlement verification is live.
async function getPurchaseStatus(
  _uid: string
): Promise<{ hasPurchased: boolean }> {
  return { hasPurchased: false }
}

// Local-development convenience only. Never use this as real purchase security.
const DEV_UID = import.meta.env.VITE_DEV_UID ?? ""

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  const isDevBuild =
    import.meta.env.DEV ||
    import.meta.env.VITE_BYPASS_ENTITLEMENT === "true" ||
    Boolean(DEV_UID && authUser?.uid === DEV_UID)

  if (isDevBuild) {
    nav.resetTo("home")
    return
  }

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
    nav.resetTo("pricing")
  }
}