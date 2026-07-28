package com.njdrive50.app.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "drive_points")
data class DrivePoint(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    val sessionId: Long,          // FK → DriveSession.id
    val timestamp: Long,          // epoch millis
    val latitude: Double,
    val longitude: Double,
    val speedMph: Float,
    val bearing: Float,
    val altitude: Double?,
    val accuracy: Float?
)
