import { useNav } from "../src/state/navStore"
import { getProfile } from "../src/state/profileStore"
import type { User } from "firebase/auth"

export async function startupController(authUser: User | null) {
  const nav = useNav.getState()
  const profile = getProfile()

  // 1. Not logged in → Login
  if (!authUser) {
    nav.resetTo("login")
    return
  }

  // 2. No profile saved → First-time user → Landing
  if (!profile) {
    nav.resetTo("landingApp")
    return
  }

  const { isOnboarded } = profile

  // 3. Logged in but NOT onboarded → Intro
  if (!isOnboarded) {
    nav.resetTo("intro")
    return
  }

  // 4. Fully onboarded → Home
  nav.resetTo("home")
}
