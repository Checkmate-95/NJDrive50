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

  if (!authUser.emailVerified) {
    nav.resetTo("verifyEmail")
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
    // Falling back to "intro" here would send an already-onboarded user
    // backward through onboarding on a transient read failure, breaking
    // the "intro never reappears" guarantee. "home" is the safer default —
    // worst case they see a possibly-stale dashboard, not a broken flow.
    nav.resetTo("home")
  }
}