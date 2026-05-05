// src/engine/solarEngine.ts
import { getSunrise, getSunset } from 'sunrise-sunset-js'

export type SolarWindow = {
  sunrise: Date | null
  sunset:  Date | null
}

/**
 * Returns sunrise and sunset times for a given location and date.
 * Uses sunrise-sunset-js and guards against null values.
 */
export function getSolarWindowForDate(
  latitude:  number,
  longitude: number,
  date: Date = new Date()
): SolarWindow {
  const sunrise = getSunrise(latitude, longitude, date) ?? null
  const sunset  = getSunset(latitude, longitude, date)  ?? null
  return { sunrise, sunset }
}

/**
 * Determines if a drive start time qualifies as a night drive.
 * Missing solar data → treated as NOT verified night.
 */
export function isNightDrive(
  startTime:   Date,
  solarWindow: SolarWindow
): boolean {
  if (!solarWindow.sunrise || !solarWindow.sunset) return false
  return startTime < solarWindow.sunrise || startTime > solarWindow.sunset
}

/* -------------------------------------------------------
   DAY / NIGHT SPLITTING ENGINE
   Returns fractional hours for each segment.
   Assumes solarWindow covers the SAME calendar day as the drive.
   For multi-day drives, call once per calendar day and sum.
------------------------------------------------------- */

export function computeDayNightSplit(
  startTime:   Date,
  endTime:     Date,
  solarWindow: SolarWindow
): { dayHours: number; nightHours: number } {

  // [FIX‑1] Validate time range before any calculation
  if (endTime <= startTime) {
    return { dayHours: 0, nightHours: 0 }
  }

  // [FIX‑2] Missing solar data → entire drive treated as DAY
  if (!solarWindow.sunrise || !solarWindow.sunset) {
    const totalMs    = endTime.getTime() - startTime.getTime()
    const totalHours = totalMs / (1000 * 60 * 60)
    return { dayHours: totalHours, nightHours: 0 }
  }

  // [FIX‑3] Guard against invalid solar data (polar day/night)
  if (solarWindow.sunset <= solarWindow.sunrise) {
    const totalMs    = endTime.getTime() - startTime.getTime()
    const totalHours = totalMs / (1000 * 60 * 60)
    return { dayHours: totalHours, nightHours: 0 }
  }

  const sunrise = solarWindow.sunrise.getTime()
  const sunset  = solarWindow.sunset.getTime()
  const start   = startTime.getTime()
  const end     = endTime.getTime()

  let dayMs   = 0
  let nightMs = 0

  // Case 1: Entire drive before sunrise → all night
  if (end <= sunrise) {
    nightMs = end - start
  }
  // Case 2: Entire drive after sunset → all night
  else if (start >= sunset) {
    nightMs = end - start
  }
  // Case 3: Entire drive between sunrise and sunset → all day
  else if (start >= sunrise && end <= sunset) {
    dayMs = end - start
  }
  // Case 4: Drive crosses sunrise (starts at night, ends during day)
  else if (start < sunrise && end > sunrise && end <= sunset) {
    nightMs = sunrise - start
    dayMs   = end - sunrise
  }
  // Case 5: Drive crosses sunset (starts during day, ends at night)
  else if (start >= sunrise && start < sunset && end > sunset) {
    dayMs   = sunset - start
    nightMs = end - sunset
  }
  // Case 6: Drive spans both sunrise and sunset (rare)
  else {
    nightMs  = sunrise - start      // pre‑sunrise night
    dayMs    = sunset  - sunrise    // daylight window
    nightMs += end     - sunset     // post‑sunset night
  }

  // [FIX‑4] Math.max guards prevent negative precision artifacts
  return {
    dayHours:   Math.max(dayMs   / (1000 * 60 * 60), 0),
    nightHours: Math.max(nightMs / (1000 * 60 * 60), 0),
  }
}
