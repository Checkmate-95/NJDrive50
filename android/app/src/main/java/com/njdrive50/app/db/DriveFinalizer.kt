package com.njdrive50.app.db

import android.content.Context
import java.util.Date
import kotlin.math.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object DriveFinalizer {

    private const val MAX_ACCEPTABLE_ACCURACY_METERS = 30f
    private const val MAX_ALLOWED_GAP_MS = 60_000L
    private const val MIN_DURATION_MS = 60_000L
    private const val MIN_DISTANCE_METERS = 50.0
    private const val MIN_POINT_COUNT = 3

    private data class Segment(val points: List<DrivePointEntity>)

    suspend fun finalizeDrive(
        context: Context,
        dao: DriveDao,
        session: DriveSessionEntity
    ): FinalizedDriveEntity = withContext(Dispatchers.IO) {

        val driveId = session.driveId
        val points = dao.getPointsForDrive(driveId)

        val now = System.currentTimeMillis()

        if (points.isEmpty()) {
            return@withContext FinalizedDriveEntity(
                driveId = driveId,
                startedAtMs = session.startedAtMs,
                endedAtMs = now,
                durationMs = now - session.startedAtMs,
                dayDurationMs = 0L,
                nightDurationMs = 0L,
                distanceMeters = null,
                verificationStatus = "INCOMPLETE",
                driveType = "UNKNOWN",
                pointCount = 0,
                finalizedAtMs = now,
                schemaVersion = 1
            )
        }

        val first = points.first()
        val last = points.last()

        val startedAtMs = first.timestampMs
        val endedAtMs = last.timestampMs

        // Split into contiguous segments wherever a >60s gap occurs — this is
        // what actually excludes paused time from duration/day-night/distance,
        // rather than just flagging the drive as ESTIMATED.
        val segments = mutableListOf<Segment>()
        var currentSegment = mutableListOf(points[0])

        var maxGapMs = 0L
        for (i in 0 until points.size - 1) {
            val gap = points[i + 1].timestampMs - points[i].timestampMs
            if (gap > maxGapMs) maxGapMs = gap

            if (gap > MAX_ALLOWED_GAP_MS) {
                segments.add(Segment(currentSegment))
                currentSegment = mutableListOf(points[i + 1])
            } else {
                currentSegment.add(points[i + 1])
            }
        }
        segments.add(Segment(currentSegment))

        val reliablePoints = points.filter {
            it.accuracyMeters == null || it.accuracyMeters <= MAX_ACCEPTABLE_ACCURACY_METERS
        }.ifEmpty { points }
        val reliableSet = reliablePoints.toHashSet()

        var totalDurationMs = 0L
        var totalDistanceMeters = 0.0
        var totalDayMs = 0L
        var totalNightMs = 0L
        var anyUnverifiedSegment = false

        for (segment in segments) {
            val segPoints = segment.points
            if (segPoints.size < 2) continue

            val segStart = segPoints.first().timestampMs
            val segEnd = segPoints.last().timestampMs
            totalDurationMs += (segEnd - segStart)

            val segReliable = segPoints.filter { reliableSet.contains(it) }.ifEmpty { segPoints }
            for (i in 0 until segReliable.size - 1) {
                val p1 = segReliable[i]
                val p2 = segReliable[i + 1]
                totalDistanceMeters += haversine(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
            }

            val segSplit = SolarEngine.computeDayNightSplit(
                Date(segStart),
                Date(segEnd)
            ) { date -> SolarEngine.getSolarWindowForDate(first.latitude, first.longitude, date) }

            totalDayMs += (segSplit.dayHours * 3_600_000.0).toLong()
            totalNightMs += (segSplit.nightHours * 3_600_000.0).toLong()

            if (segSplit.mode == "unverified") {
                anyUnverifiedSegment = true
            }
        }

        val durationMs = totalDurationMs
        val dayMs = totalDayMs
        val nightMs = totalNightMs

        val driveType = when {
            dayMs > 0 && nightMs > 0 -> "MIXED"
            nightMs > 0 -> "NIGHT_ONLY"
            dayMs > 0 -> "DAY_ONLY"
            else -> "UNKNOWN"
        }

        val verificationStatus = when {
            durationMs < MIN_DURATION_MS -> "ESTIMATED"
            points.size < MIN_POINT_COUNT -> "ESTIMATED"
            totalDistanceMeters < MIN_DISTANCE_METERS -> "ESTIMATED"
            anyUnverifiedSegment -> "ESTIMATED"
            else -> "VERIFIED"
        }

        return@withContext FinalizedDriveEntity(
            driveId = driveId,
            startedAtMs = startedAtMs,
            endedAtMs = endedAtMs,
            durationMs = durationMs,
            dayDurationMs = dayMs,
            nightDurationMs = nightMs,
            distanceMeters = totalDistanceMeters,
            verificationStatus = verificationStatus,
            driveType = driveType,
            pointCount = points.size,
            finalizedAtMs = now,
            schemaVersion = 1
        )
    }

    private fun haversine(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val R = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)

        val a = sin(dLat / 2).pow(2.0) +
                cos(Math.toRadians(lat1)) *
                cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2.0)

        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    }
}