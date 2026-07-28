package com.njdrive50.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.njdrive50.app.db.DriveDatabase;
import com.njdrive50.app.db.DriveDao;

public class MainActivity extends BridgeActivity {

    private DriveDao driveDao;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize Room database
        DriveDatabase db = DriveDatabase.Companion.getInstance(getApplicationContext());
        driveDao = db.driveDao();
    }

    public DriveDao getDriveDao() {
        return driveDao;
    }
}
