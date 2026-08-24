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
  } catch {}
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

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  if (!authUser) {
    nav.resetTo("login")
    return
  }

  const shouldBypassEntitlement =
    isDevMode() ||
    getViteEnvVar("VITE_BYPASS_ENTITLEMENT") === "true"

  if (shouldBypassEntitlement) {
    nav.resetTo("home")
    return
  }

  try {
    if (!hasProfile()) {
      nav.resetTo("intro")
      return
    }

    const profile = getProfile()

    if (!profile || !profile.isOnboarded) {
      nav.resetTo("intro")
      return
    }

    nav.resetTo("home")
  } catch (error) {
    console.error("Startup error:", error)
    nav.resetTo("intro")
  }
}