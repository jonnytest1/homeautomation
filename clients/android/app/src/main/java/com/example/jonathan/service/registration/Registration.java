package com.example.jonathan.service.registration;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class Registration {

    public static final String BARCODE_SENDER_DEVICE_KEY = "mobile-device";
    public static final String SHARE_URL_SENDER_DEVICE_KEY = "mobile-device-share-url";


    private final Context context;

    public Registration(Context context) {

        this.context = context;
    }

    public static String getReceiverDeviceName() {
        if (Build.MODEL.equals("SM-X200")) {
            return BARCODE_SENDER_DEVICE_KEY + "-tablet";
        }
        return BARCODE_SENDER_DEVICE_KEY;
    }

    public void checkRegistration() {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences("data", Context.MODE_PRIVATE);
        Long version = 0L;
        try {
            PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            version = packageInfo.getLongVersionCode();
        } catch (PackageManager.NameNotFoundException e) {
            Log.e("registration", "checkRegistration: ", e);
        }
        // @see /app/build.gradle#10 (android.defaultConfig.versionCode)
        // needs sync
        if (prefs.getLong("firstLaunchVersion", 0L) < version) {
            prefs.edit().putLong("firstLaunchVersion", version).commit();

            ExecutorService pool = Executors.newFixedThreadPool(2);
            pool.submit(new BarcodeSenderRegistration());
            pool.submit(new ShareSenderRegistration());
            pool.submit(new ReceiverRegistration());
            try {
                pool.awaitTermination(2, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
