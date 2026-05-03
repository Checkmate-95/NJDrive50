// src/components/meters/NightBadge.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  useDriveState() hook replaces getDriveState() direct call —
//          getDriveState() is a one-time snapshot that never re-renders.
//          NightBadge now reactively updates when solar.isNightEligible
//          changes during an active drive (e.g. crossing sunrise/sunset)
// [FIX-2]  hasSolar wrapped in !! — forces a clean boolean regardless of
//          whether sunrise/sunset are Dates, strings, or null values

import { useDriveState } from "../../state/driveStore"

export default function NightBadge() {
  // [FIX-1] Reactive subscription — re-renders when solar state changes
  const { solar } = useDriveState()

  const isNight = solar.isNightEligible

  // [FIX-2] !! ensures a clean boolean — safe for Date, string, or null
  const hasSolar = !!(solar.solarWindow?.sunrise && solar.solarWindow?.sunset)

  let label = "Daytime Drive"
  let bg    = "bg-[#0A1E5E]/10"
  let text  = "text-[#0A1E5E] border-[#0A1E5E]/30"

  if (hasSolar && isNight) {
    label = "Night • Verified"
    bg    = "bg-[#0A1E5E]"
    text  = "text-white border-[#f9c80e]"
  } else if (!hasSolar && isNight) {
    label = "Night • Estimated"
    bg    = "bg-[#f9c80e]/20"
    text  = "text-[#0A1E5E] border-[#f9c80e]"
  }

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold tracking-tight ${bg} ${text}`}
    >
      {label}
    </div>
  )
}