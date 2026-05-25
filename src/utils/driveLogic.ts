export type DriveScoreInput = {
  minutes: number
  isNight: boolean
  weather?: string | null
  confirmed: boolean
}

const WEATHER_BONUS: Record<string, number> = {
  rain: 4,
  snow: 6,
}

export function computeDriveScoreV2(d: DriveScoreInput): number {
  const minutes = Math.max(0, d.minutes)
  const weather = d.weather?.trim().toLowerCase() ?? ""

  const durationScore = Math.min(minutes / 10, 10)
  const nightBonus = d.isNight ? 5 : 0
  const weatherBonus = WEATHER_BONUS[weather] ?? 0
  const confirmationBonus = d.confirmed ? 2 : 0

  return Math.round(durationScore + nightBonus + weatherBonus + confirmationBonus)
}