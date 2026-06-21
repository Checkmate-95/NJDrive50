import { useNav } from "../src/state/navStore"
import { getProfile, hasProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()

  // 1. Not logged in → Login
  if (!authUser) {
    nav.resetTo("login")
    return
  }

  // 2. Logged in but no local profile → Intro (not landingApp — they're already registered)
  if (!hasProfile()) {
    nav.resetTo("intro")
    return
  }

  const { isOnboarded } = getProfile()

  // 3. Has profile but not onboarded → Intro
  if (!isOnboarded) {
    nav.resetTo("intro")
    return
  }

  // 4. Fully onboarded → Home
  nav.resetTo("home")
}