package com.njdrive50.app.db

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationAvailability
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class DriveTrackingService : Service() {

    companion object {
        const val CHANNEL_ID = "njdrive50_drive_channel"
        const val CHANNEL_NAME = "Drive Recording"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "START_DRIVE"
        const val ACTION_STOP = "STOP_DRIVE"
        const val EXTRA_DRIVE_ID = "driveId"

        private const val WAKE_LOCK_TAG = "NJDrive50::DriveTrackingWakeLock"
        private const val WAKE_LOCK_TIMEOUT_MS = 10 * 60 * 1000L // 10 minutes, renewed periodically

        // Threshold used to auto-finalize orphaned ACTIVE sessions found at next launch/restart.
        const val STALE_SESSION_THRESHOLD_MS = 2 * 60 * 60 * 1000L // 2 hours
    }

    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.IO + job)
    private lateinit var dao: DriveDao

    private lateinit var fusedClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var locationRequest: LocationRequest

    private var wakeLock: PowerManager.WakeLock? = null
    private var activeDriveId: String? = null

    override fun onCreate() {
        super.onCreate()
        dao = DriveDatabase.getInstance(applicationContext).driveDao()
        createNotificationChannel()

        fusedClient = LocationServices.getFusedLocationProviderClient(applicationContext)
        setupLocationRequest()
        setupLocationCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            // Service restarted by the system with no intent (e.g. after process death).
            // Recover any session left ACTIVE, or finalize it as INCOMPLETE if too stale.
            scope.launch { recoverOrFinalizeStaleSession() }
            return START_STICKY
        }

        when (intent.action) {
            ACTION_START -> {
                val driveId = intent.getStringExtra(EXTRA_DRIVE_ID) ?: return START_NOT_STICKY
                startDriveInternal(driveId)
            }

            ACTION_STOP -> {
                val driveId = intent.getStringExtra(EXTRA_DRIVE_ID) ?: activeDriveId
                if (driveId != null) {
                    stopDriveInternal(driveId)
                } else {
                    stopSelf()
                }
            }
        }

        return START_STICKY
    }

    // -----------------------------------------------------------------
    // Permission checks
    // -----------------------------------------------------------------

    private fun hasLocationPermission(): Boolean {
        val fineGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val coarseGranted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        return fineGranted || coarseGranted
    }

    // -----------------------------------------------------------------
    // Start / Stop
    // -----------------------------------------------------------------

    private fun startDriveInternal(driveId: String) {
        val permissionGranted = hasLocationPermission()
        activeDriveId = driveId

        scope.launch {
            val existing = dao.getSession(driveId)
            if (existing == null) {
                val now = System.currentTimeMillis()
                val session = DriveSessionEntity(
                    driveId = driveId,
                    startedAtMs = now,
                    endedAtMs = null,
                    status = "ACTIVE",
                    startLatitude = null,
                    startLongitude = null,
                    locationPermissionGranted = permissionGranted,
                    createdAtMs = now,
                    updatedAtMs = now
                )
                dao.insertSession(session)
            }
        }

        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildForegroundNotification(driveId),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )

        acquireWakeLock()

        if (permissionGranted) {
            startLocationUpdates()
        } else {
            // No permission at start — nothing will ever be recorded.
            // Session remains ACTIVE until explicitly stopped or recovered as stale;
            // it will finalize as INCOMPLETE since it will have zero points.
        }
    }

    private fun stopDriveInternal(driveId: String) {
        stopLocationUpdates()

        scope.launch {
            val session = dao.getSession(driveId)
            if (session != null && session.status == "ACTIVE") {
                val finalized = DriveFinalizer.finalizeDrive(applicationContext, dao, session)
                dao.insertFinalizedDrive(finalized)

                dao.updateSession(
                    session.copy(
                        status = "FINALIZED",
                        endedAtMs = finalized.endedAtMs,
                        updatedAtMs = System.currentTimeMillis()
                    )
                )
            }

            activeDriveId = null
            releaseWakeLock()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    /**
     * Force-closes an ACTIVE session without waiting for a clean stop —
     * used for permission-revoked-mid-drive, battery-saver kill detection,
     * or any failure path where recording can no longer continue safely.
     */
    private fun stopAsIncomplete(reason: String) {
        android.util.Log.w("DriveTrackingService", "Stopping as INCOMPLETE: $reason")
        stopLocationUpdates()

        val driveId = activeDriveId
        scope.launch {
            if (driveId != null) {
                val session = dao.getSession(driveId)
                if (session != null && session.status == "ACTIVE") {
                    val finalized = DriveFinalizer.finalizeDrive(applicationContext, dao, session)
                    dao.insertFinalizedDrive(finalized)

                    dao.updateSession(
                        session.copy(
                            status = "FINALIZED",
                            endedAtMs = finalized.endedAtMs,
                            updatedAtMs = System.currentTimeMillis()
                        )
                    )
                }
            }

            activeDriveId = null
            releaseWakeLock()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    /**
     * Called when the service restarts with no intent (system-restarted after death,
     * or after reboot if you wire a BOOT_COMPLETED receiver later).
     * Recovers a genuinely-recent ACTIVE session, or force-finalizes a stale one
     * as INCOMPLETE rather than leaving it stuck forever.
     */
    private suspend fun recoverOrFinalizeStaleSession() {
        val session = dao.getActiveSession() ?: return
        val age = System.currentTimeMillis() - session.startedAtMs

        if (age > STALE_SESSION_THRESHOLD_MS) {
            val finalized = DriveFinalizer.finalizeDrive(applicationContext, dao, session)
            dao.insertFinalizedDrive(finalized)
            dao.updateSession(
                session.copy(
                    status = "FINALIZED",
                    endedAtMs = finalized.endedAtMs,
                    updatedAtMs = System.currentTimeMillis()
                )
            )
        } else {
            activeDriveId = session.driveId
            if (hasLocationPermission()) {
                startLocationUpdates()
            }
        }
    }

    // -----------------------------------------------------------------
    // Location tracking
    // -----------------------------------------------------------------

    private fun setupLocationRequest() {
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            2_000L
        )
            .setMinUpdateIntervalMillis(1_000L)
            .setMinUpdateDistanceMeters(0f)
            .setMaxUpdateDelayMillis(5_000L)
            .build()
    }

    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.locations.forEach { location -> handleLocation(location) }
            }

            override fun onLocationAvailability(availability: LocationAvailability) {
                if (!availability.isLocationAvailable) {
                    android.util.Log.w("DriveTrackingService", "Location currently unavailable")
                }
            }
        }
    }

    private fun startLocationUpdates() {
        if (!hasLocationPermission()) {
            stopAsIncomplete("permission missing at startLocationUpdates")
            return
        }

        try {
            fusedClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                mainLooper
            )
        } catch (e: SecurityException) {
            stopAsIncomplete("SecurityException requesting location updates")
        }
    }

    private fun stopLocationUpdates() {
        if (::fusedClient.isInitialized && ::locationCallback.isInitialized) {
            fusedClient.removeLocationUpdates(locationCallback)
        }
    }

    private fun handleLocation(location: android.location.Location) {
        val driveId = activeDriveId ?: return

        // Mid-drive permission revocation check — Android won't always kill
        // the callback immediately, so verify on every fix.
        if (!hasLocationPermission()) {
            stopAsIncomplete("permission revoked mid-drive")
            return
        }

        val point = DrivePointEntity(
            driveId = driveId,
            timestampMs = location.time,
            elapsedRealtimeNanos = location.elapsedRealtimeNanos,
            latitude = location.latitude,
            longitude = location.longitude,
            speedMetersPerSecond = if (location.hasSpeed()) location.speed else null,
            bearingDegrees = if (location.hasBearing()) location.bearing else null,
            altitudeMeters = if (location.hasAltitude()) location.altitude else null,
            accuracyMeters = if (location.hasAccuracy()) location.accuracy else null,
            provider = location.provider
        )

        scope.launch {
            dao.insertPoint(point)
        }
    }

    // -----------------------------------------------------------------
    // Wake lock
    // -----------------------------------------------------------------

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return

        val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            WAKE_LOCK_TAG
        ).apply {
            setReferenceCounted(false)
            acquire(WAKE_LOCK_TIMEOUT_MS)
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
    }

    // -----------------------------------------------------------------
    // Notification (with Stop action button)
    // -----------------------------------------------------------------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Visible while NJDrive50 records an active drive."
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(driveId: String): Notification {
        val stopIntent = Intent(this, DriveTrackingService::class.java).apply {
            action = ACTION_STOP
            putExtra(EXTRA_DRIVE_ID, driveId)
        }

        val stopPendingIntent = PendingIntent.getService(
            this,
            0,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NJDrive50 is recording your drive")
            .setContentText("Drive tracking is active.")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop Drive",
                stopPendingIntent
            )
            .build()
    }

    // -----------------------------------------------------------------
    // Lifecycle safety
    // -----------------------------------------------------------------

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        // App swiped away from recents. Recording should continue —
        // this is intentionally a no-op so the foreground service keeps running.
        // Do NOT call stopSelf() or stopAsIncomplete() here.
    }

    override fun onDestroy() {
        // Defensive finalization: if the service is being destroyed while a
        // drive is still ACTIVE (e.g. killed by the system unexpectedly),
        // force-finalize rather than leaving an orphaned session.
        val driveId = activeDriveId
        if (driveId != null) {
            scope.launch {
                val session = dao.getSession(driveId)
                if (session != null && session.status == "ACTIVE") {
                    val finalized = DriveFinalizer.finalizeDrive(applicationContext, dao, session)
                    dao.insertFinalizedDrive(finalized)
                    dao.updateSession(
                        session.copy(
                            status = "FINALIZED",
                            endedAtMs = finalized.endedAtMs,
                            updatedAtMs = System.currentTimeMillis()
                        )
                    )
                }
            }
        }

        stopLocationUpdates()
        releaseWakeLock()
        job.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}