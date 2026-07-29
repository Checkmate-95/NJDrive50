package com.njdrive50.app.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface DriveDao {

    // -----------------------------
    // Drive Points (raw GPS evidence)
    // -----------------------------
    @Insert
    suspend fun insertPoint(point: DrivePointEntity)

    @Insert
    suspend fun insertPoints(points: List<DrivePointEntity>)

    @Query("""
        SELECT * FROM drive_points
        WHERE driveId = :driveId
        ORDER BY timestampMs ASC
    """)
    suspend fun getPointsForDrive(driveId: String): List<DrivePointEntity>


    // -----------------------------
    // Drive Session (active/in-progress)
    // -----------------------------
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertSession(session: DriveSessionEntity)

    @Query("""
        SELECT * FROM drive_sessions
        WHERE driveId = :driveId
        LIMIT 1
    """)
    suspend fun getSession(driveId: String): DriveSessionEntity?

    @Update
    suspend fun updateSession(session: DriveSessionEntity)

    @Query("""
        SELECT * FROM drive_sessions
        WHERE status = 'ACTIVE'
        LIMIT 1
    """)
    suspend fun getActiveSession(): DriveSessionEntity?


    // -----------------------------
    // Finalized Drive (immutable truth)
    // -----------------------------
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertFinalizedDrive(drive: FinalizedDriveEntity)

    @Query("""
        SELECT * FROM finalized_drives
        WHERE driveId = :driveId
        LIMIT 1
    """)
    suspend fun getFinalizedDrive(driveId: String): FinalizedDriveEntity?

    @Query("""
        SELECT * FROM finalized_drives
        WHERE startedAtMs BETWEEN :fromMs AND :toMs
        ORDER BY startedAtMs DESC
    """)
    suspend fun getFinalizedDrivesInRange(fromMs: Long, toMs: Long): List<FinalizedDriveEntity>
}