package com.example.jonathan.service.registration;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class Registration {

    public static final String BARCODE_SENDER_DEVICE_KEY ="mobile-device";
    public static final String SHARE_URL_SENDER_DEVICE_KEY ="mobile-device-share-url";
    private final Context context;

    public Registration(Context context){

        this.context=context;
    }

    public static String getReceiverDeviceName(){
        if(Build.MODEL.equals("SM-X200")){
            return BARCODE_SENDER_DEVICE_KEY+"-tablet";
        }
        return BARCODE_SENDER_DEVICE_KEY;
    }

    public void checkRegistration(){
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences("data", Context.MODE_PRIVATE);
        if(!prefs.getBoolean("firstLaunch",false)){
            prefs.edit().putBoolean("firstLaunch",true).commit();

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
