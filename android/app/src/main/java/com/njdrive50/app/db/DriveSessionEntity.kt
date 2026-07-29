package com.njdrive50.app.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "drive_sessions")
data class DriveSessionEntity(
    @PrimaryKey
    val driveId: String,          // UUID for the drive

    val startedAtMs: Long,        // epoch millis
    val endedAtMs: Long? = null,  // null until finalized

    val status: String,           // ACTIVE, STOPPING, FINALIZED, INCOMPLETE

    val startLatitude: Double? = null,
    val startLongitude: Double? = null,

    val locationPermissionGranted: Boolean = false,

    val createdAtMs: Long,
    val updatedAtMs: Long
)
