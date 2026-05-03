// src/utils/driveLogic.ts

export type DriveScoreInput = {
  minutes: number
  isNight: boolean
  weather?: string | null
  confirmed: boolean
}

export function computeDriveScoreV2(d: DriveScoreInput): number {
  const minutes = Math.max(0, d.minutes)
  const weather = d.weather?.trim().toLowerCase()

  const durationScore = Math.min(minutes / 10, 10)
  const nightBonus = d.isNight ? 5 : 0

  const weatherBonus =
    weather === "rain"
      ? 4
      : weather === "snow"
        ? 6
        : 0

  const baseScore = durationScore + nightBonus + weatherBonus
  const confirmationBonus = d.confirmed ? 2 : 0

  return Math.round(baseScore + confirmationBonus)
}