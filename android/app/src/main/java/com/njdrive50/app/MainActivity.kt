package com.njdrive50.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(DrivePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}