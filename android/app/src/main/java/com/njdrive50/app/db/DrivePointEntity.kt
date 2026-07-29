package com.njdrive50.app.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "drive_points")
data class DrivePointEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    val driveId: String,
    val timestampMs: Long,
    val elapsedRealtimeNanos: Long,
    val latitude: Double,
    val longitude: Double,
    val speedMetersPerSecond: Float?,
    val bearingDegrees: Float?,
    val altitudeMeters: Double?,
    val accuracyMeters: Float?,
    val provider: String?
)
