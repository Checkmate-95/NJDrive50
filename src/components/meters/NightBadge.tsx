// src/components/meters/NightBadge.tsx
// CORRECTED: switched from useDriveState() (driveStore.ts) to
// useActiveDriveStore() (activeDriveStore.ts). The old useDriveState()
// hook read from a "solar" object that was only ever populated by
// updateSolarForDrive() — a function that is never called anywhere in
// the app, meaning this badge was permanently stuck showing null/unknown
// state. useActiveDriveStore() is actively, correctly maintained by the
// live tick loop during every drive.

import { useActiveDriveStore } from "../../state/activeDriveStore"

export default function NightBadge() {
  const session = useActiveDriveStore((state) => state.session)

  const isNight = session.currentMode === "night"
  const isUnverifiedMode = session.currentMode === "unverified"
  const isSolarVerified = session.solarStatus === "verified"

  let label = "Daytime Drive"
  let bg = "bg-[#0A1E5E]/10"
  let text = "text-[#0A1E5E] border-[#0A1E5E]/30"

  if (isNight && isSolarVerified) {
    label = "Night • Verified"
    bg = "bg-[#0A1E5E]"
    text = "text-white border-[#f9c80e]"
  } else if (isNight && !isSolarVerified) {
    label = "Night • Estimated"
    bg = "bg-[#f9c80e]/20"
    text = "text-[#0A1E5E] border-[#f9c80e]"
  } else if (isUnverifiedMode) {
    label = "Lighting Unverified"
    bg = "bg-amber-300/20"
    text = "text-[#0A1E5E] border-amber-300"
  }

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold tracking-tight ${bg} ${text}`}
    >
      {label}
    </div>
  )
}