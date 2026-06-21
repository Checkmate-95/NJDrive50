import { useNav } from "../src/state/navStore"
import { getProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()
  const profile = getProfile()

  // 1. FIRST‑TIME USER (no profile saved)
  if (!profile) {
    nav.resetTo("landingApp")
    return
  }

  // 2. RETURNING USER (profile exists)
  const { profileComplete, isOnboarded } = profile

  // 2A. RETURNING USER — LOGGED OUT
  if (!authUser) {
    nav.resetTo("login")
    return
  }

  // 2B. RETURNING USER — LOGGED IN
  if (profileComplete && !isOnboarded) {
    nav.resetTo("intro")
    return
  }

  // Fully onboarded → Home Dashboard
  nav.resetTo("home")
}
