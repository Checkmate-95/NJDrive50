package com.njdrive50.app.db

import android.content.Context
import java.util.Calendar
import java.util.Date
import java.util.TimeZone
import kotlin.math.*

data class SolarWindow(
    val sunrise: Date?,
    val sunset: Date?
)

data class DayNightSplit(
    val dayHours: Double,
    val nightHours: Double,
    val mode: String // "solar" or "unverified"
)

object SolarEngine {

    // CONFIRM: your TS engine and NJDrive50 requirements have referenced
    // both 30 and 40 minutes in different places. Both engines MUST match.
    private const val NIGHT_OFFSET_MS = 30 * 60 * 1000L

    private fun isValidDate(value: Date?): Boolean {
        return value != null
    }

    private fun isValidCoordinates(latitude: Double, longitude: Double): Boolean {
        return latitude.isFinite() &&
                longitude.isFinite() &&
                latitude in -90.0..90.0 &&
                longitude in -180.0..180.0
    }

    private fun getOverlapMs(
        rangeStart: Long,
        rangeEnd: Long,
        windowStart: Long,
        windowEnd: Long
    ): Long {
        return max(0L, min(rangeEnd, windowEnd) - max(rangeStart, windowStart))
    }

    private fun toSolarLookupDate(date: Date): Date {
        val cal = Calendar.getInstance(TimeZone.getDefault())
        cal.time = date
        cal.set(Calendar.HOUR_OF_DAY, 12)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.time
    }

    private fun getCivilNightEndMs(sunriseMs: Long): Long {
        return sunriseMs - NIGHT_OFFSET_MS
    }

    private fun getCivilNightStartMs(sunsetMs: Long): Long {
        return sunsetMs + NIGHT_OFFSET_MS
    }

    private fun isBeforeDawnOrAfterDusk(
        timestampMs: Long,
        civilNightEndMs: Long,
        civilNightStartMs: Long
    ): Boolean {
        return timestampMs < civilNightEndMs || timestampMs >= civilNightStartMs
    }

    // -----------------------------------------------------------------
    // Sunrise/Sunset calculation
    // Standard NOAA solar position algorithm (same basis as most
    // sunrise/sunset libraries, including sunrise-sunset-js).
    // Returns null/null if the sun does not rise or set that day
    // (polar regions) — not expected for NJ, but handled safely.
    // -----------------------------------------------------------------
    private fun calculateSunriseSunset(
        latitude: Double,
        longitude: Double,
        date: Date
    ): Pair<Date?, Date?> {
        val cal = Calendar.getInstance(TimeZone.getDefault())
        cal.time = date

        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH) + 1
        val day = cal.get(Calendar.DAY_OF_MONTH)

        val zenith = 90.833 // official sunrise/sunset zenith (accounts for refraction)

        val sunriseUtcMinutes = calculateSolarEventUtcMinutes(
            year, month, day, latitude, longitude, zenith, isSunrise = true
        )
        val sunsetUtcMinutes = calculateSolarEventUtcMinutes(
            year, month, day, latitude, longitude, zenith, isSunrise = false
        )

        if (sunriseUtcMinutes == null || sunsetUtcMinutes == null) {
            return Pair(null, null)
        }

        val sunrise = utcMinutesToDate(year, month, day, sunriseUtcMinutes)
        val sunset = utcMinutesToDate(year, month, day, sunsetUtcMinutes)

        return Pair(sunrise, sunset)
    }

    private fun calculateSolarEventUtcMinutes(
        year: Int,
        month: Int,
        day: Int,
        latitude: Double,
        longitude: Double,
        zenith: Double,
        isSunrise: Boolean
    ): Double? {
        val n1 = floor(275.0 * month / 9.0)
        val n2 = floor((month + 9.0) / 12.0)
        val n3 = 1.0 + floor((year - 4.0 * floor(year / 4.0) + 2.0) / 3.0)
        val n = n1 - (n2 * n3) + day - 30.0

        val lngHour = longitude / 15.0
        val t = if (isSunrise) n + ((6.0 - lngHour) / 24.0) else n + ((18.0 - lngHour) / 24.0)

        val m = (0.9856 * t) - 3.289

        var l = m + (1.916 * sin(Math.toRadians(m))) +
                (0.020 * sin(Math.toRadians(2 * m))) + 282.634
        l = normalizeDegrees(l)

        var ra = Math.toDegrees(atan(0.91764 * tan(Math.toRadians(l))))
        ra = normalizeDegrees(ra)

        val lQuadrant = floor(l / 90.0) * 90.0
        val raQuadrant = floor(ra / 90.0) * 90.0
        ra = ra + (lQuadrant - raQuadrant)
        ra /= 15.0

        val sinDec = 0.39782 * sin(Math.toRadians(l))
        val cosDec = cos(asin(sinDec))

        val cosH = (cos(Math.toRadians(zenith)) - (sinDec * sin(Math.toRadians(latitude)))) /
                (cosDec * cos(Math.toRadians(latitude)))

        if (cosH > 1.0 || cosH < -1.0) {
            return null // sun never rises or never sets on this date/location
        }

        val h = if (isSunrise) {
            360.0 - Math.toDegrees(acos(cosH))
        } else {
            Math.toDegrees(acos(cosH))
        } / 15.0

        val time = h + ra - (0.06571 * t) - 6.622
        val utcMinutes = ((time - lngHour) * 60.0)

        return normalizeMinutes(utcMinutes)
    }

    private fun normalizeDegrees(value: Double): Double {
        var v = value
        while (v < 0) v += 360.0
        while (v >= 360) v -= 360.0
        return v
    }

    private fun normalizeMinutes(value: Double): Double {
        var v = value
        while (v < 0) v += 1440.0
        while (v >= 1440) v -= 1440.0
        return v
    }

    private fun utcMinutesToDate(year: Int, month: Int, day: Int, utcMinutes: Double): Date {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        cal.set(year, month - 1, day, 0, 0, 0)
        cal.set(Calendar.MILLISECOND, 0)
        cal.add(Calendar.MINUTE, utcMinutes.toInt())
        cal.add(Calendar.SECOND, ((utcMinutes - utcMinutes.toInt()) * 60).toInt())
        return cal.time
    }

    // -----------------------------------------------------------------
    // Public API — mirrors src/engine/solarEngine.ts
    // -----------------------------------------------------------------

    fun getSolarWindowForDate(
        latitude: Double,
        longitude: Double,
        date: Date = Date()
    ): SolarWindow {
        if (!isValidCoordinates(latitude, longitude)) {
            return SolarWindow(null, null)
        }

        return try {
            val lookupDate = toSolarLookupDate(date)
            val (sunrise, sunset) = calculateSunriseSunset(latitude, longitude, lookupDate)

            if (!isValidDate(sunrise) || !isValidDate(sunset) || sunset!!.time <= sunrise!!.time) {
                SolarWindow(null, null)
            } else {
                SolarWindow(sunrise, sunset)
            }
        } catch (_: Exception) {
            SolarWindow(null, null)
        }
    }

    fun isNightDrive(timestampMs: Long, solarWindow: SolarWindow): Boolean {
        val sunrise = solarWindow.sunrise
        val sunset = solarWindow.sunset

        if (!isValidDate(sunrise) || !isValidDate(sunset)) return false
        if (sunset!!.time <= sunrise!!.time) return false

        val civilNightEndMs = getCivilNightEndMs(sunrise.time)
        val civilNightStartMs = getCivilNightStartMs(sunset.time)

        return isBeforeDawnOrAfterDusk(timestampMs, civilNightEndMs, civilNightStartMs)
    }

    fun isNight(
        context: Context,
        latitude: Double,
        longitude: Double,
        timestampMs: Long
    ): Boolean {
        val date = Date(timestampMs)
        val solarWindow = getSolarWindowForDate(latitude, longitude, date)

        if (!isValidDate(solarWindow.sunrise) || !isValidDate(solarWindow.sunset)) return false

        return isNightDrive(timestampMs, solarWindow)
    }

    fun computeDayNightSplit(
        startTime: Date,
        endTime: Date,
        solarWindowForDate: (Date) -> SolarWindow
    ): DayNightSplit {
        val startMs = startTime.time
        val endMs = endTime.time
        if (endMs <= startMs) {
            return DayNightSplit(0.0, 0.0, "unverified")
        }

        var cursor = Date(startMs)
        var dayMs = 0L
        var nightMs = 0L
        var anyUnverified = false

        while (cursor.time < endMs) {
            val segmentDate = toSolarLookupDate(cursor)
            val solarWindow = solarWindowForDate(segmentDate)
            val sunrise = solarWindow.sunrise
            val sunset = solarWindow.sunset

            val cal = Calendar.getInstance(TimeZone.getDefault())
            cal.time = segmentDate
            cal.set(Calendar.HOUR_OF_DAY, 24)
            cal.set(Calendar.MINUTE, 0)
            cal.set(Calendar.SECOND, 0)
            cal.set(Calendar.MILLISECOND, 0)
            val nextMidnightMs = cal.time.time

            val segmentEnd = min(nextMidnightMs, endMs)
            val segStart = cursor.time
            val segEnd = segmentEnd

            if (!isValidDate(sunrise) || !isValidDate(sunset) || sunset!!.time <= sunrise!!.time) {
                nightMs += segEnd - segStart
                anyUnverified = true
                cursor = Date(segmentEnd)
                continue
            }

            val civilNightEndMs = getCivilNightEndMs(sunrise.time)
            val civilNightStartMs = getCivilNightStartMs(sunset.time)

            val dayOverlap = getOverlapMs(segStart, segEnd, civilNightEndMs, civilNightStartMs)
            val nightOverlap = (segEnd - segStart) - dayOverlap

            dayMs += dayOverlap
            nightMs += nightOverlap

            cursor = Date(segmentEnd)
        }

        val dayHours = dayMs / 3_600_000.0
        val nightHours = nightMs / 3_600_000.0
        val mode = if (anyUnverified) "unverified" else "solar"

        return DayNightSplit(dayHours, nightHours, mode)
    }
}