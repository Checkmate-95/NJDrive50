// src/engine/solarEngine.ts
import { getSunrise, getSunset } from "sunrise-sunset-js"

export type SolarWindow = {
  sunrise: Date | null
  sunset: Date | null
}

export type SolarSplitMode = "solar" | "unverified"

export type DayNightSplit = {
  dayHours: number
  nightHours: number
  mode: SolarSplitMode
}

export type SolarMode = "day" | "night" | "unverified"

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime())
}

function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function getOverlapMs(
  rangeStart: number,
  rangeEnd: number,
  windowStart: number,
  windowEnd: number
): number {
  return Math.max(
    0,
    Math.min(rangeEnd, windowEnd) - Math.max(rangeStart, windowStart)
  )
}

/**
 * Single source of truth for the night-boundary rule: a timestamp counts as
 * night when it falls before sunrise or at/after sunset. Both
 * getCurrentSolarMode() and isNightDrive() delegate here so the rule can
 * never drift between the two call sites.
 */
function isBeforeSunriseOrAfterSunset(
  timestamp: Date,
  sunrise: Date,
  sunset: Date
): boolean {
  return timestamp < sunrise || timestamp >= sunset
}

/**
 * Returns the sunrise and sunset for the supplied coordinates and local date.
 * Invalid input or an invalid solar calculation returns null values.
 */
export function getSolarWindowForDate(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SolarWindow {
  if (!isValidCoordinates(latitude, longitude) || !isValidDate(date)) {
    return { sunrise: null, sunset: null }
  }

  try {
    const rawSunrise = getSunrise(latitude, longitude, date)
    const rawSunset = getSunset(latitude, longitude, date)

    const sunrise = isValidDate(rawSunrise) ? rawSunrise : null
    const sunset = isValidDate(rawSunset) ? rawSunset : null

    if (!sunrise || !sunset || sunset.getTime() <= sunrise.getTime()) {
      return { sunrise: null, sunset: null }
    }

    return { sunrise, sunset }
  } catch {
    return { sunrise: null, sunset: null }
  }
}

/**
 * Determines whether a specific timestamp falls during darkness.
 * This is appropriate for a live status or drive-start indicator.
 * Use computeDayNightSplit() to classify a complete drive.
 */
export function isNightDrive(
  timestamp: Date,
  solarWindow: SolarWindow
): boolean {
  if (!isValidDate(timestamp)) return false

  const { sunrise, sunset } = solarWindow

  if (!isValidDate(sunrise) || !isValidDate(sunset)) return false
  if (sunset.getTime() <= sunrise.getTime()) return false

  return isBeforeSunriseOrAfterSunset(timestamp, sunrise, sunset)
}

/**
 * Gets the current day/night state from solar times only.
 * "night" means before sunrise or at/after sunset.
 */
export function getCurrentSolarMode(
  date: Date,
  latitude: number,
  longitude: number
): SolarMode {
  if (!isValidDate(date)) return "unverified"

  const solarWindow = getSolarWindowForDate(latitude, longitude, date)
  const { sunrise, sunset } = solarWindow

  if (!sunrise || !sunset) return "unverified"

  return isNightDrive(date, solarWindow) ? "night" : "day"
}

/**
 * Splits one same-calendar-day drive into daylight and darkness hours.
 *
 * For a drive spanning midnight, split it into calendar-day segments,
 * call this once per segment using that segment's solar window, then sum
 * the returned dayHours and nightHours.
 */
export function computeDayNightSplit(
  startTime: Date,
  endTime: Date,
  solarWindow: SolarWindow
): DayNightSplit {
  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const startMs = startTime.getTime()
  const endMs = endTime.getTime()

  if (endMs <= startMs) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const { sunrise, sunset } = solarWindow

  if (!isValidDate(sunrise) || !isValidDate(sunset)) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const sunriseMs = sunrise.getTime()
  const sunsetMs = sunset.getTime()

  if (sunsetMs <= sunriseMs) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const totalMs = endMs - startMs
  const dayMs = getOverlapMs(startMs, endMs, sunriseMs, sunsetMs)
  const nightMs = totalMs - dayMs

  return {
    dayHours: dayMs / 3_600_000,
    nightHours: nightMs / 3_600_000,
    mode: "solar",
  }
}