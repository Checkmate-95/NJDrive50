// src/utils/driveLogic.ts

export type DriveScoreInput = {
  minutes: number
  isNight: boolean
  weather?: string | null
  confirmed: boolean
}

export function computeDriveScoreV2(d: DriveScoreInput): number {
  const minutes = Math.max(0, d.minutes)

  let score = 0

  // Duration weight (max 10 points)
  score += Math.min(minutes / 10, 10)

  // Night bonus
  if (d.isNight) score += 5

  // Weather difficulty
  switch (d.weather?.trim().toLowerCase()) {
    case "rain":
      score += 4
      break
    case "snow":
      score += 6
      break
    default:
      break
  }

  // Confirmation multiplier
  if (d.confirmed) score *= 1.2

  return Math.round(score)
}