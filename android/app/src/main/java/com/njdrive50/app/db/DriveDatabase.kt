package com.njdrive50.app.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        DrivePointEntity::class,
        DriveSessionEntity::class,
        FinalizedDriveEntity::class
    ],
    version = 3,          // ✅ bumped from 2 → 3
    exportSchema = false
)
abstract class DriveDatabase : RoomDatabase() {

    abstract fun driveDao(): DriveDao

    companion object {
        @Volatile
        private var INSTANCE: DriveDatabase? = null

        @JvmStatic
        fun getInstance(context: Context): DriveDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    DriveDatabase::class.java,
                    "njdrive50.db"
                )
                    .fallbackToDestructiveMigration()   // ✅ safe for dev; wipes old schema automatically
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
