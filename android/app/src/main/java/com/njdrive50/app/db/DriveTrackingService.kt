package com.njdrive50.app.db

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
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
        const val CHANNEL_ID = "drive_tracking_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "START_DRIVE"
        const val ACTION_STOP = "STOP_DRIVE"
        const val EXTRA_DRIVE_ID = "driveId"
    }

    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.IO + job)
    private lateinit var dao: DriveDao

    private lateinit var fusedClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private var activeDriveId: String? = null

    override fun onCreate() {
        super.onCreate()
        dao = DriveDatabase.getInstance(applicationContext).driveDao()
        createNotificationChannel()

        fusedClient = LocationServices.getFusedLocationProviderClient(applicationContext)
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.locations.forEach { location ->
                    handleLocation(location)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) {
            scope.launch {
                dao.getActiveSession()?.let { session ->
                    activeDriveId = session.driveId
                }
            }
            return START_STICKY
        }

        when (intent.action) {
            ACTION_START -> {
                val driveId = intent.getStringExtra(EXTRA_DRIVE_ID) ?: return START_NOT_STICKY
                startDriveInternal(driveId)
            }

            ACTION_STOP -> {
                val driveId = intent.getStringExtra(EXTRA_DRIVE_ID) ?: return START_NOT_STICKY
                stopDriveInternal(driveId)
            }
        }

        return START_STICKY
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

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
            buildNotification("Drive in progress"),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )

        if (permissionGranted) {
            startLocationUpdates()
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
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    private fun startLocationUpdates() {
        if (!hasLocationPermission()) return

        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            2000L
        )
            .setMinUpdateIntervalMillis(1000L)
            .setMaxUpdateDelayMillis(5000L)
            .build()

        try {
            fusedClient.requestLocationUpdates(
                request,
                locationCallback,
                mainLooper
            )
        } catch (e: SecurityException) {
            // Permission revoked between the check above and this call.
            // The session will finalize as INCOMPLETE due to lack of points.
        }
    }

    private fun stopLocationUpdates() {
        fusedClient.removeLocationUpdates(locationCallback)
    }

    private fun handleLocation(location: Location) {
        val driveId = activeDriveId ?: return

        val point = DrivePointEntity(
            driveId = driveId,
            timestampMs = location.time,
            latitude = location.latitude,
            longitude = location.longitude,
            speedMetersPerSecond = if (location.hasSpeed()) location.speed else null,
            bearingDegrees = if (location.hasBearing()) location.bearing else null,
            altitudeMeters = if (location.hasAltitude()) location.altitude else null,
            accuracyMeters = if (location.hasAccuracy()) location.accuracy else null
        )

        scope.launch {
            dao.insertPoint(point)
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Drive Tracking",
            NotificationManager.IMPORTANCE_LOW
        )

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NJDrive50")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}