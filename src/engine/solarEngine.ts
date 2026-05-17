// src/engine/solarEngine.ts
import { getSunrise, getSunset } from "sunrise-sunset-js"

export type SolarWindow = {
  sunrise: Date | null
  sunset: Date | null
}

function isFiniteCoord(value: number): boolean {
  return Number.isFinite(value)
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
  if (!isFiniteCoord(latitude) || !isFiniteCoord(longitude)) {
    return { sunrise: null, sunset: null }
  }

  try {
    const sunrise = getSunrise(latitude, longitude, date) ?? null
    const sunset = getSunset(latitude, longitude, date) ?? null

    const safeSunrise =
      sunrise instanceof Date && !Number.isNaN(sunrise.getTime()) ? sunrise : null
    const safeSunset =
      sunset instanceof Date && !Number.isNaN(sunset.getTime()) ? sunset : null

    return { sunrise: safeSunrise, sunset: safeSunset }
  } catch {
    return { sunrise: null, sunset: null }
  }
}

/**
 * Determines if a drive start time qualifies as a night drive.
 * Missing or invalid solar data → treated as NOT verified night.
 */
export function isNightDrive(
  startTime: Date,
  solarWindow: SolarWindow
): boolean {
  if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) return false
  if (!solarWindow.sunrise || !solarWindow.sunset) return false
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
): { dayHours: number; nightHours: number } {
  if (
    !(startTime instanceof Date) ||
    !(endTime instanceof Date) ||
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime())
  ) {
    return { dayHours: 0, nightHours: 0 }
  }

  const start = startTime.getTime()
  const end = endTime.getTime()

  if (end <= start) {
    return { dayHours: 0, nightHours: 0 }
  }

  const totalMs = end - start

  if (!solarWindow.sunrise || !solarWindow.sunset) {
    return {
      dayHours: totalMs / (1000 * 60 * 60),
      nightHours: 0,
    }
  }

  const sunrise = solarWindow.sunrise.getTime()
  const sunset = solarWindow.sunset.getTime()

  if (
    Number.isNaN(sunrise) ||
    Number.isNaN(sunset) ||
    sunset <= sunrise
  ) {
    return {
      dayHours: totalMs / (1000 * 60 * 60),
      nightHours: 0,
    }
  }

  const dayMs = getOverlapMs(start, end, sunrise, sunset)
  const nightMs = Math.max(totalMs - dayMs, 0)

  return {
    dayHours: Math.max(dayMs / (1000 * 60 * 60), 0),
    nightHours: Math.max(nightMs / (1000 * 60 * 60), 0),
  }
}