package com.example.jonathan.barcode.service;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class Startup extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Context applicationContext=context.getApplicationContext();
        Log.i("startup","receivedStartup");
        String action = intent.getAction();
        Log.d("broadcasatReceiver","got Action "+action);
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)||Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            Log.i("startup","registering");
        }
    }
}
