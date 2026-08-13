// core/startupController.ts
import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

function isDevMode(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
    return true
  }
  try {
    const meta = import.meta as any
    if (meta?.env?.DEV) {
      return true
    }
  } catch {
    // ignore
  }
  return false
}

function getViteEnvVar(key: string): string | undefined {
  try {
    const meta = import.meta as any
    return meta?.env?.[key]
  } catch {
    return undefined
  }
}

// Temporary placeholder until Google Play Billing / verified
// entitlement lookup has been implemented.
async function getPurchaseStatus(
  _uid: string
): Promise<{ hasPurchased: boolean }> {
  return { hasPurchased: false }
}

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  const shouldBypassEntitlement =
    isDevMode() ||
    getViteEnvVar("VITE_BYPASS_ENTITLEMENT") === "true"

  // Always show the app landing page to signed-out users.
  if (!authUser) {
    nav.resetTo("landingApp")
    return
  }

  // Dev-only: logged-in users skip the temporary purchase check.
  if (shouldBypassEntitlement) {
    nav.resetTo("home")
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