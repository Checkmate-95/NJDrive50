package com.njdrive50.app.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "finalized_drives")
data class FinalizedDriveEntity(
    @PrimaryKey
    val driveId: String,

    val startedAtMs: Long,
    val endedAtMs: Long,
    val durationMs: Long,

    val dayDurationMs: Long,
    val nightDurationMs: Long,

    val distanceMeters: Double?,

    val verificationStatus: String,   // VERIFIED, ESTIMATED, INCOMPLETE
    val driveType: String,            // DAY_ONLY, NIGHT_ONLY, MIXED

    val pointCount: Int,

    val finalizedAtMs: Long,

    val schemaVersion: Int = 1
)
