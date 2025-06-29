package com.example.jonathan.service;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

import static com.example.jonathan.service.BLEServer.MESSENGER_NOTIFICATION;

public class NotificationListener extends NotificationListenerService {

    Messenger bleService;


    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        // This method is called when a new notification is posted
        String packageName = sbn.getPackageName();
        String notificationTitle = sbn.getNotification().extras.getString("android.title");
        String notificationText = sbn.getNotification().extras.getString("android.text");
     

        Log.d("NotificationListener", "Notification posted:");
        Log.d("NotificationListener", "Package: " + packageName);
        Log.d("NotificationListener", "Title: " + notificationTitle);
        Log.d("NotificationListener", "Text: " + notificationText);
        // cancelNotification(sbn.getKey())
        // Here you can forward the notification details to your Bluetooth watch
        // You can also filter which notifications to handle by checking the packageName
        WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);

        if (wifiManager != null && wifiManager.isWifiEnabled()) {
            // Get the current Wi-Fi connection
            WifiInfo wifiInfo = wifiManager.getConnectionInfo();

            if (wifiInfo.getNetworkId() != -1) {
                Map<String, String> props = new HashMap<>();
                props.put("message", "notification posted");
                props.put("title", notificationTitle);
                props.put("Text", notificationText);
                props.put("package", packageName);
                props.put("not_id", "" + sbn.getId());
                props.put("not_key", "" + sbn.getKey());

                Bundle extras = sbn.getNotification().extras;
                for (String key : extras.keySet()) {
                    try {
                        props.put("extra_" + key, extras.get(key).toString());
                    } catch (Exception e) {
                        // well idk
                    }
                }

                CLogging.log(CLogging.LogLevel.DEBUG, props);
            }
        }

        if (bleService != null) {
            Message msg = Message.obtain(null,
                    MESSENGER_NOTIFICATION, sbn.getNotification().extras);
            try {
                bleService.send(msg);

            } catch (RemoteException e) {
                Log.e("NotificationListener", "error sending message", e);
            }
        }
    }


    @Override
    public void onCreate() {
        super.onCreate();
        bindService(new Intent(NotificationListener.this,
                BLEServer.class), new ServiceConnection() {
            @Override
            public void onServiceConnected(ComponentName name, IBinder service) {
                bleService = new Messenger(service);
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {

            }
        }, Context.BIND_AUTO_CREATE);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // This method is called when a notification is removed
        String packageName = sbn.getPackageName();
        Log.d("NotificationListener", "Notification removed from package: " + packageName);
    }
}
