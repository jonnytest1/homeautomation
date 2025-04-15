package com.example.jonathan.service;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootBroadcastReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        // Check if the broadcast is the BOOT_COMPLETED broadcast
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            // Start your service here
            Intent serviceIntent = new Intent(context, BLEServer.class);
            context.startService(serviceIntent);
        }
    }
}