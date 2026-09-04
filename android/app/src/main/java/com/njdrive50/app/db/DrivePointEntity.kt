// C:\Dev\NJDRIVE50\android\app\src\main\java\com\njdrive50\app\db\DrivePointEntity.kt
package com.njdrive50.app.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "drive_points",
    indices = [Index(value = ["driveId"])]
)
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