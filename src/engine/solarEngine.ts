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
 * Single source of truth for the night-boundary rule.
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
    const lookupDate = toSolarLookupDate(date)

    const rawSunrise = getSunrise(latitude, longitude, lookupDate)
    const rawSunset = getSunset(latitude, longitude, lookupDate)

   console.log(
  "[SOLAR_ENGINE]",
  JSON.stringify(
    {
      latitude,
      longitude,
      inputDate: date.toString(),
      lookupDate: lookupDate.toString(),
      inputTzOffset: date.getTimezoneOffset(),
      lookupTzOffset: lookupDate.getTimezoneOffset(),
      rawSunrise: rawSunrise?.toString(),
      rawSunset: rawSunset?.toString(),
    },
    null,
    2
  )
)




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

  const totalMs = endMs - startMs
  const dayMs = getOverlapMs(startMs, endMs, sunriseMs, sunsetMs)
  const nightMs = totalMs - dayMs

  return {
    dayHours: dayMs / 3_600_000,
    nightHours: nightMs / 3_600_000,
    mode: "solar",
  }
}
