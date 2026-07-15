// core/startupController.ts
import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

// Temporary placeholder until Google Play Billing / verified
// entitlement lookup has been implemented.
async function getPurchaseStatus(
  _uid: string
): Promise<{ hasPurchased: boolean }> {
  return { hasPurchased: false }
}

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  // Development-only bypass.
  // Controlled by C:\Dev\NJDRIVE50\.env.development.local:
  // VITE_BYPASS_ENTITLEMENT=true
  const shouldBypassEntitlement =
    import.meta.env.DEV ||
    import.meta.env.VITE_BYPASS_ENTITLEMENT === "true"

  if (shouldBypassEntitlement) {
    nav.resetTo("home")
    return
  }

  // Signed-out production users see the app landing screen.
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

    // Do not grant paid access if the entitlement lookup fails.
    nav.resetTo("pricing")
  }
}