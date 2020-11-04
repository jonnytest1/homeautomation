package com.example.jonathan.barcode.service.registration;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class Registration {

    public static final String DEVICE_KEY ="mobile-device";

    private final Context context;

    public Registration(Context context){
        this.context=context;
    }

    public void checkRegistration(){
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences("data", Context.MODE_PRIVATE);
        if(!prefs.getBoolean("firstLaunch",false)){
            prefs.edit().putBoolean("firstLaunch",true).commit();

            ExecutorService pool = Executors.newFixedThreadPool(2);
            pool.submit(new SenderRegistration());
            pool.submit(new ReceiverRegistration());
            try {
                pool.awaitTermination(2, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }


        }
    }
}
