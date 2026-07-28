package com.njdrive50.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

class DriveTrackingService : Service() {

    companion object {
        private const val CHANNEL_ID = "njdrive50_drive_channel"
        private const val CHANNEL_NAME = "Drive Recording"
        private const val NOTIFICATION_ID = 1001
        private const val WAKE_LOCK_TAG = "NJDrive50:ActiveDrive"
        private const val WAKE_LOCK_TIMEOUT_MS = 2 * 60 * 60 * 1000L // 2 hours
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private lateinit var locationCallback: LocationCallback

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        setupLocationTracking()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildForegroundNotification(),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )

        acquireWakeLock()

        if (!hasLocationPermission()) {
            stopAsIncomplete()
            return START_NOT_STICKY
        }

        startLocationTracking()
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        stopLocationTracking()
        releaseWakeLock()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

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

    private fun setupLocationTracking() {
        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5_000L
        )
            .setMinUpdateIntervalMillis(2_500L)
            .setMinUpdateDistanceMeters(10f)
            .setMaxUpdateDelayMillis(15_000L)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.locations.forEach { location ->
                    if (!location.hasAccuracy() || location.accuracy > 100f) return@forEach

                    android.util.Log.d(
                        "DriveTrackingService",
                        "lat=${location.latitude}, lng=${location.longitude}, " +
                            "accuracy=${location.accuracy}, time=${location.time}"
                    )

                    // TODO: Persist native point immediately (sessionId, lat, lng, accuracy, speed, bearing, timestamps)
                }
            }

            override fun onLocationAvailability(availability: com.google.android.gms.location.LocationAvailability) {
                if (!availability.isLocationAvailable) {
                    android.util.Log.w("DriveTrackingService", "Location currently unavailable")
                }
            }
        }
    }

    private fun startLocationTracking() {
        if (!hasLocationPermission()) {
            stopAsIncomplete()
            return
        }

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            mainLooper
        )
    }

    private fun stopLocationTracking() {
        if (::fusedLocationClient.isInitialized && ::locationCallback.isInitialized) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return

        val powerManager = getSystemService(PowerManager::class.java) ?: return

        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            WAKE_LOCK_TAG
        ).apply {
            setReferenceCounted(false)
            acquire(WAKE_LOCK_TIMEOUT_MS)
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let { lock ->
            if (lock.isHeld) lock.release()
        }
        wakeLock = null
    }

    private fun stopAsIncomplete() {
        // TODO: Persist session status as NEEDS_REVIEW / INTERRUPTED
        stopLocationTracking()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Visible while NJDrive50 records an active drive."
            }

            getSystemService(NotificationManager::class.java)
                ?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("NJDrive50 is recording your drive")
            .setContentText("Drive tracking is active.")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
    }
}
