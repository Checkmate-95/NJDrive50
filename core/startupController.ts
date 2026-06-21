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

  // 2. No profile data saved → First-time user → Landing
  if (!hasProfile()) {
    nav.resetTo("landingApp")
    return
  }

  const { isOnboarded } = getProfile()

  // 3. Logged in but NOT onboarded → Intro
  if (!isOnboarded) {
    nav.resetTo("intro")
    return
  }

  // 4. Fully onboarded → Home
  nav.resetTo("home")
}