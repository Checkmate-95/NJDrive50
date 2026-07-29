package com.njdrive50.app.db

import android.content.Context
import kotlin.math.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object DriveFinalizer {

    private const val MAX_ACCEPTABLE_ACCURACY_METERS = 30f
    private const val MAX_ALLOWED_GAP_MS = 60_000L
    private const val MIN_DURATION_MS = 60_000L
    private const val MIN_DISTANCE_METERS = 50.0
    private const val MIN_POINT_COUNT = 3

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
        val durationMs = endedAtMs - startedAtMs

        val reliablePoints = points.filter {
            it.accuracyMeters == null || it.accuracyMeters <= MAX_ACCEPTABLE_ACCURACY_METERS
        }.ifEmpty { points }

        var totalDistanceMeters = 0.0
        for (i in 0 until reliablePoints.size - 1) {
            val p1 = reliablePoints[i]
            val p2 = reliablePoints[i + 1]
            totalDistanceMeters += haversine(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
        }

        var dayMs = 0L
        var nightMs = 0L
        var maxGapMs = 0L

        for (i in 0 until points.size - 1) {
            val p1 = points[i]
            val p2 = points[i + 1]

            val segmentDuration = p2.timestampMs - p1.timestampMs
            if (segmentDuration <= 0) continue

            if (segmentDuration > maxGapMs) maxGapMs = segmentDuration

            val isNight = SolarEngine.isNight(
                context,
                p1.latitude,
                p1.longitude,
                p1.timestampMs
            )

            if (isNight) nightMs += segmentDuration
            else dayMs += segmentDuration
        }

        val driveType = when {
            dayMs > 0 && nightMs > 0 -> "MIXED"
            nightMs > 0 -> "NIGHT_ONLY"
            else -> "DAY_ONLY"
        }

        val verificationStatus = when {
            durationMs < MIN_DURATION_MS -> "ESTIMATED"
            points.size < MIN_POINT_COUNT -> "ESTIMATED"
            totalDistanceMeters < MIN_DISTANCE_METERS -> "ESTIMATED"
            maxGapMs > MAX_ALLOWED_GAP_MS -> "ESTIMATED"
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