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

export type DriveSegments = {
  type: "Day Only" | "Night Only" | "Mixed Drive" | "Unknown"
  nightStartMs: number | null
  nightEndMs: number | null
  dayStartMs: number | null
  dayEndMs: number | null
}

const THIRTY_MIN_MS = 30 * 60 * 1000

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
 * Fix for sunrise-sunset-js UTC date-boundary bug:
 * Always anchor the lookup date to LOCAL NOON so the library
 * cannot accidentally resolve sunrise/sunset for the wrong day.
 */
function toSolarLookupDate(date: Date): Date {
  const local = new Date(date)
  local.setHours(12, 0, 0, 0)
  return local
}

/**
 * Civil night ends 30 minutes before sunrise (dawn boundary).
 */
function getCivilNightEndMs(sunriseMs: number): number {
  return sunriseMs - THIRTY_MIN_MS
}

/**
 * Civil night starts 30 minutes after sunset (dusk boundary).
 */
function getCivilNightStartMs(sunsetMs: number): number {
  return sunsetMs + THIRTY_MIN_MS
}

/**
 * Night = before civil dawn OR after civil dusk.
 */
function isBeforeDawnOrAfterDusk(
  timestampMs: number,
  civilNightEndMs: number,
  civilNightStartMs: number
): boolean {
  return timestampMs < civilNightEndMs || timestampMs >= civilNightStartMs
}

/**
 * Returns the sunrise and sunset for the supplied coordinates and local date.
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
    const lookupDate = toSolarLookupDate(date)

    const rawSunrise = getSunrise(latitude, longitude, lookupDate)
    const rawSunset = getSunset(latitude, longitude, lookupDate)

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
 * Determines whether a specific timestamp falls during civil darkness.
 */
export function isNightDrive(
  timestamp: Date,
  solarWindow: SolarWindow
): boolean {
  if (!isValidDate(timestamp)) return false

  const { sunrise, sunset } = solarWindow
  if (!isValidDate(sunrise) || !isValidDate(sunset)) return false
  if (sunset.getTime() <= sunrise.getTime()) return false

  const civilNightEndMs = getCivilNightEndMs(sunrise.getTime())
  const civilNightStartMs = getCivilNightStartMs(sunset.getTime())

  return isBeforeDawnOrAfterDusk(
    timestamp.getTime(),
    civilNightEndMs,
    civilNightStartMs
  )
}

/**
 * Gets the current day/night state from solar times only.
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

  const civilNightEndMs = getCivilNightEndMs(sunriseMs)
  const civilNightStartMs = getCivilNightStartMs(sunsetMs)
  const totalMs = endMs - startMs

  const dayMs = getOverlapMs(startMs, endMs, civilNightEndMs, civilNightStartMs)
  const nightMs = totalMs - dayMs

  return {
    dayHours: dayMs / 3_600_000,
    nightHours: nightMs / 3_600_000,
    mode: "solar",
  }
}

/**
 * Segment-level split for UI: returns actual timestamps for night/day portions.
 */
export function splitDriveBySolar(
  startTime: Date,
  endTime: Date,
  solarWindow: SolarWindow
): DriveSegments {
  const invalid: DriveSegments = {
    type: "Unknown",
    nightStartMs: null,
    nightEndMs: null,
    dayStartMs: null,
    dayEndMs: null,
  }

  if (!isValidDate(startTime) || !isValidDate(endTime)) return invalid

  const startMs = startTime.getTime()
  const endMs = endTime.getTime()
  if (endMs <= startMs) return invalid

  const { sunrise, sunset } = solarWindow
  if (!isValidDate(sunrise) || !isValidDate(sunset)) return invalid

  const sunriseMs = sunrise.getTime()
  const sunsetMs = sunset.getTime()
  if (sunsetMs <= sunriseMs) return invalid

  const civilNightEndMs = getCivilNightEndMs(sunriseMs)
  const civilNightStartMs = getCivilNightStartMs(sunsetMs)

  // Night Only
  if (endMs <= civilNightEndMs || startMs >= civilNightStartMs) {
    return {
      type: "Night Only",
      nightStartMs: startMs,
      nightEndMs: endMs,
      dayStartMs: null,
      dayEndMs: null,
    }
  }

  // Day Only
  if (startMs >= civilNightEndMs && endMs <= civilNightStartMs) {
    return {
      type: "Day Only",
      nightStartMs: null,
      nightEndMs: null,
      dayStartMs: startMs,
      dayEndMs: endMs,
    }
  }

  const crossesDawn = startMs < civilNightEndMs && endMs > civilNightEndMs
  const crossesDusk = startMs < civilNightStartMs && endMs > civilNightStartMs

  // Mixed: night → day
  if (crossesDawn) {
    return {
      type: "Mixed Drive",
      nightStartMs: startMs,
      nightEndMs: civilNightEndMs,
      dayStartMs: civilNightEndMs,
      dayEndMs: endMs,
    }
  }

  // Mixed: day → night
  if (crossesDusk) {
    return {
      type: "Mixed Drive",
      nightStartMs: civilNightStartMs,
      nightEndMs: endMs,
      dayStartMs: startMs,
      dayEndMs: civilNightStartMs,
    }
  }

  // Fallback
  return {
    type: "Day Only",
    nightStartMs: null,
    nightEndMs: null,
    dayStartMs: startMs,
    dayEndMs: endMs,
  }
}

/**
 * Final safety net — ensures UI label always matches the computed hours.
 */
export function classifyDriveType(
  dayHours: number,
  nightHours: number
): "Day Only" | "Night Only" | "Mixed Drive" {
  const EPSILON = 0.01

  const hasDay = dayHours > EPSILON
  const hasNight = nightHours > EPSILON

  if (hasDay && hasNight) return "Mixed Drive"
  if (hasNight) return "Night Only"
  if (hasDay) return "Day Only"

  return "Day Only" // safe default — near-zero-duration drives shouldn't imply night
}
