package com.njdrive50.app.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [DrivePoint::class, DriveSession::class],
    version = 1,
    exportSchema = true
)
abstract class DriveDatabase : RoomDatabase() {

    abstract fun driveDao(): DriveDao

    companion object {
        @Volatile
        private var INSTANCE: DriveDatabase? = null

        fun getInstance(context: Context): DriveDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    DriveDatabase::class.java,
                    "njdrive50.db"
                ).build().also { INSTANCE = it }
            }
        }
    }
}
