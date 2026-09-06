// C:\Dev\NJDRIVE50\android\app\src\main\java\com\njdrive50\app\DrivePlugin.kt
package com.njdrive50.app

import android.Manifest
import android.content.Intent
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.getcapacitor.PluginMethod
import com.njdrive50.app.db.DriveDao
import com.njdrive50.app.db.DriveDatabase
import com.njdrive50.app.db.FinalizedDriveEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject

@CapacitorPlugin(
    name = "Drive",
    permissions = [
        Permission(
            strings = [Manifest.permission.ACCESS_FINE_LOCATION],
            alias = "location"
        )
    ]
)
class DrivePlugin : Plugin() {

    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.IO + job)


    // -----------------------------
    // START DRIVE
    // -----------------------------
    @PluginMethod
    fun startDrive(call: PluginCall) {
        val driveId = call.getString("driveId")
        if (driveId.isNullOrBlank()) {
            call.reject("driveId is required")
            return
        }

        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.setKeepAlive(true)
            requestPermissionForAlias("location", call, "locationPermsCallback")
            return
        }

        launchDriveService(call, driveId)
    }

    @PermissionCallback
    private fun locationPermsCallback(call: PluginCall) {
        val driveId = call.getString("driveId")
        if (driveId.isNullOrBlank()) {
            call.reject("driveId is required")
            return
        }

        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("Location permission was denied")
            return
        }

        launchDriveService(call, driveId)
    }

    private fun launchDriveService(call: PluginCall, driveId: String) {
        // ✅ Starting: must use startForegroundService
        val intent = Intent(context, DriveTrackingService::class.java).apply {
            action = DriveTrackingService.ACTION_START
            putExtra(DriveTrackingService.EXTRA_DRIVE_ID, driveId)
        }
        ContextCompat.startForegroundService(context, intent)

        val result = JSObject().apply {
            put("driveId", driveId)
            put("status", "ACTIVE")
        }
        call.resolve(result)
    }

    // -----------------------------
    // PAUSE DRIVE
    // -----------------------------
    @PluginMethod
    fun pauseDrive(call: PluginCall) {
        val driveId = call.getString("driveId")
        if (driveId.isNullOrBlank()) {
            call.reject("driveId is required")
            return
        }

        val intent = Intent(context, DriveTrackingService::class.java).apply {
            action = DriveTrackingService.ACTION_PAUSE
            putExtra(DriveTrackingService.EXTRA_DRIVE_ID, driveId)
        }
        context.startService(intent)

        val result = JSObject().apply {
            put("driveId", driveId)
            put("status", "PAUSED")
        }
        call.resolve(result)
    }

    // -----------------------------
    // RESUME DRIVE
    // -----------------------------
    @PluginMethod
    fun resumeDrive(call: PluginCall) {
        val driveId = call.getString("driveId")
        if (driveId.isNullOrBlank()) {
            call.reject("driveId is required")
            return
        }

        val intent = Intent(context, DriveTrackingService::class.java).apply {
            action = DriveTrackingService.ACTION_RESUME
            putExtra(DriveTrackingService.EXTRA_DRIVE_ID, driveId)
        }
        context.startService(intent)

        val result = JSObject().apply {
            put("driveId", driveId)
            put("status", "ACTIVE")
        }
        call.resolve(result)
    }

    // -----------------------------
    // STOP DRIVE
    // -----------------------------
    @PluginMethod
    fun stopDrive(call: PluginCall) {
        val driveId = call.getString("driveId")
        if (driveId.isNullOrBlank()) {
            call.reject("driveId is required")
            return
        }

        // ✅ Stopping: plain startService, not startForegroundService
        val stopIntent = Intent(context, DriveTrackingService::class.java).apply {
            action = DriveTrackingService.ACTION_STOP
            putExtra(DriveTrackingService.EXTRA_DRIVE_ID, driveId)
        }
        context.startService(stopIntent)

        scope.launch {
            val dao = DriveDatabase.getInstance(context).driveDao()
            val entity = waitForFinalizedDrive(dao, driveId)

            if (entity == null) {
                call.reject("Drive did not finalize within expected time for driveId=$driveId")
                return@launch
            }

            call.resolve(entity.toJSObject())
        }
    }

    // -----------------------------
    // DELETE ALL LOCAL DATA (wipes drive_points, drive_sessions, finalized_drives)
    // Rejects if a drive is currently ACTIVE, to avoid deleting rows out from
    // under a running DriveTrackingService mid-recording.
    // -----------------------------
    @PluginMethod
    fun deleteAllLocalData(call: PluginCall) {
        scope.launch {
            try {
                val dao = DriveDatabase.getInstance(context).driveDao()

                val active = dao.getActiveSession()
                if (active != null) {
                    call.reject("Cannot delete data while a drive is actively recording.")
                    return@launch
                }

                dao.deleteAllPoints()
                dao.deleteAllSessions()
                dao.deleteAllFinalizedDrives()

                val result = JSObject().apply {
                    put("success", true)
                }
                call.resolve(result)
            } catch (e: Exception) {
                android.util.Log.e("DrivePlugin", "deleteAllLocalData failed", e)
                call.reject("Failed to delete local drive data: ${e.message}")
            }
        }
    }

    private suspend fun waitForFinalizedDrive(
        dao: DriveDao,
        driveId: String,
        timeoutMs: Long = 5000L,
        pollIntervalMs: Long = 150L
    ): FinalizedDriveEntity? {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            val entity = dao.getFinalizedDrive(driveId)
            if (entity != null) return entity
            delay(pollIntervalMs)
        }
        return dao.getFinalizedDrive(driveId)
    }

    // -----------------------------
    // GET ONE FINALIZED DRIVE BY ID
    // -----------------------------
    @PluginMethod
    fun getDriveById(call: PluginCall) {
        val driveId = call.getString("driveId")
        if (driveId.isNullOrBlank()) {
            call.reject("driveId is required")
            return
        }

        scope.launch {
            val dao = DriveDatabase.getInstance(context).driveDao()
            val entity = dao.getFinalizedDrive(driveId)

            if (entity == null) {
                call.reject("No finalized drive found for driveId=$driveId")
                return@launch
            }

            call.resolve(entity.toJSObject())
        }
    }

    private fun FinalizedDriveEntity.toJSObject(): JSObject {
        return JSObject().apply {
            put("driveId", driveId)
            put("startedAtMs", startedAtMs)
            put("endedAtMs", endedAtMs)
            put("durationMs", durationMs)
            put("dayDurationMs", dayDurationMs)
            put("nightDurationMs", nightDurationMs)
            put("distanceMeters", distanceMeters ?: JSONObject.NULL)
            put("verificationStatus", verificationStatus)
            put("driveType", driveType)
            put("pointCount", pointCount)
            put("finalizedAtMs", finalizedAtMs)
            put("schemaVersion", schemaVersion)
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        job.cancel()
    }
}