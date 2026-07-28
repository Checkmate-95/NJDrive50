package com.njdrive50.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update

@Dao
interface DriveDao {

    // --- Sessions ---
    @Insert
    suspend fun insertSession(session: DriveSession): Long

    @Update
    suspend fun updateSession(session: DriveSession)

    @Query("SELECT * FROM drive_sessions ORDER BY startTime DESC")
    suspend fun getAllSessions(): List<DriveSession>

    @Query("SELECT * FROM drive_sessions WHERE id = :id LIMIT 1")
    suspend fun getSessionById(id: Long): DriveSession?


    // --- Points ---
    @Insert
    suspend fun insertPoint(point: DrivePoint): Long

    @Insert
    suspend fun insertPoints(points: List<DrivePoint>)

    @Query("SELECT * FROM drive_points WHERE sessionId = :sessionId ORDER BY timestamp ASC")
    suspend fun getPointsForSession(sessionId: Long): List<DrivePoint>

    @Query("DELETE FROM drive_points WHERE sessionId = :sessionId")
    suspend fun deletePointsForSession(sessionId: Long)
}
