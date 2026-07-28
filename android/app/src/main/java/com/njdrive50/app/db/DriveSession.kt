package com.njdrive50.app.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "drive_sessions")
data class DriveSession(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    val startTime: Long,          // epoch millis
    val endTime: Long?,           // null until drive ends
    val totalMiles: Double?,      // computed at end
    val totalDurationMillis: Long? // computed at end
)
