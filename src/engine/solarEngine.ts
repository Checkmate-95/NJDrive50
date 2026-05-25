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

function isFiniteCoord(value: number): boolean {
  return Number.isFinite(value)
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function getOverlapMs(
  rangeStart: number,
  rangeEnd: number,
  windowStart: number,
  windowEnd: number
): number {
  return Math.max(0, Math.min(rangeEnd, windowEnd) - Math.max(rangeStart, windowStart))
}

/**
 * Returns sunrise and sunset times for a given location and date.
 * Invalid coordinates or invalid solar results return null values safely.
 */
export function getSolarWindowForDate(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SolarWindow {
  if (!isFiniteCoord(latitude) || !isFiniteCoord(longitude) || !isValidDate(date)) {
    return { sunrise: null, sunset: null }
  }

  try {
    const rawSunrise = getSunrise(latitude, longitude, date) ?? null
    const rawSunset = getSunset(latitude, longitude, date) ?? null

    const safeSunrise =
      rawSunrise !== null && isValidDate(rawSunrise) ? rawSunrise : null
    const safeSunset =
      rawSunset !== null && isValidDate(rawSunset) ? rawSunset : null

    if (!safeSunrise || !safeSunset || safeSunset <= safeSunrise) {
      return { sunrise: null, sunset: null }
    }

    return { sunrise: safeSunrise, sunset: safeSunset }
  } catch {
    return { sunrise: null, sunset: null }
  }
}

/**
 * Determines if a drive start time qualifies as a verified night drive.
 * Missing or invalid solar data -> treated as NOT verified night.
 */
export function isNightDrive(startTime: Date, solarWindow: SolarWindow): boolean {
  if (!isValidDate(startTime)) return false
  if (!solarWindow.sunrise || !solarWindow.sunset) return false
  if (!isValidDate(solarWindow.sunrise) || !isValidDate(solarWindow.sunset)) return false
  if (solarWindow.sunset <= solarWindow.sunrise) return false

  return startTime < solarWindow.sunrise || startTime >= solarWindow.sunset
}

/* -------------------------------------------------------
   DAY / NIGHT SPLITTING ENGINE
   Returns fractional hours for each segment.
   Assumes solarWindow covers the SAME calendar day as the drive.
   For multi-day drives, call once per calendar day and sum.
------------------------------------------------------- */

export function computeDayNightSplit(
  startTime: Date,
  endTime: Date,
  solarWindow: SolarWindow
): DayNightSplit {
  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const start = startTime.getTime()
  const end = endTime.getTime()

  if (end <= start) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const { sunrise, sunset } = solarWindow

  if (!sunrise || !sunset) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  if (!isValidDate(sunrise) || !isValidDate(sunset)) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const sunriseMs = sunrise.getTime()
  const sunsetMs = sunset.getTime()

  if (!Number.isFinite(sunriseMs) || !Number.isFinite(sunsetMs) || sunsetMs <= sunriseMs) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const totalMs = end - start
  const dayMs = getOverlapMs(start, end, sunriseMs, sunsetMs)
  const nightMs = Math.max(totalMs - dayMs, 0)

  return {
    dayHours: Math.max(dayMs / (1000 * 60 * 60), 0),
    nightHours: Math.max(nightMs / (1000 * 60 * 60), 0),
    mode: "solar",
  }
}