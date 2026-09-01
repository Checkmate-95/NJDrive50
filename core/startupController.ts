import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import { useActiveDriveStore } from "../src/state/activeDriveStore"
import type { User } from "firebase/auth"

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



  const isDevBuild = import.meta.env.DEV
  const shouldBypassEntitlement =
  isDevBuild && getViteEnvVar("VITE_BYPASS_ENTITLEMENT") === "true"

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

    if (!profile.isOnboarded) {
      nav.resetTo("intro")
      return
    }

    const activeSession = useActiveDriveStore.getState().session

    if (activeSession?.isActive) {
      nav.resetTo("active")
      return
    }

    nav.resetTo("home")
  } catch (error) {
    console.error("Startup error:", error)
    nav.resetTo("intro")
  }
}