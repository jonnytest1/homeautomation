package com.example.jonathan.service;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.ParcelUuid;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.example.jonathan.barcode.R;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;

import static android.bluetooth.BluetoothGatt.GATT_SUCCESS;


public class BLEServer extends Service {
    public static int MESSENGER_NOTIFICATION = 1;
    private static final int NOTIFICATION_ID = 1;
    public static final UUID SERVICE_UUID =/**/  UUID.fromString("a9d865b3-72b8-4313-8693-b91f6b2c067e");
    public static final UUID CHAR_UUID = /* */   UUID.fromString("a9d865b3-72b8-4313-8693-b91f632c067e");
    public static final UUID DESCR_UUID =/*   */ UUID.fromString("a9d865b3-72b8-4313-8693-b91f642c067e");
    public static final UUID NOTIFY_DESCR = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    final Messenger mMessenger = new Messenger(new Handler() {
        @Override
        public void handleMessage(@NonNull Message msg) {
            if (msg.what == MESSENGER_NOTIFICATION) {
                Bundle extras = (Bundle) msg.obj;

                if (bluetoothGatt != null) {
                    if (ActivityCompat.checkSelfPermission(getApplicationContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {

                        return;
                    }
                    if (bluetoothGatt.getDevice() == null) {
                        Log.i("GATT", "device null");
                        return;
                    }

                    if (characteristic == null) {
                        return;
                    }

                    bluetoothGatt.writeCharacteristic(characteristic, extras.getString("android.title").getBytes(StandardCharsets.UTF_8), BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);

                }

            }

            Log.d("GATT", "got message");
        }
    });
    private BluetoothGatt bluetoothGatt;
    private BluetoothGattCharacteristic characteristic;


    private Notification createNotification() {
        NotificationChannel channel = new NotificationChannel(
                "bluetooth_channel",
                "Bluetooth Notification Channel",
                NotificationManager.IMPORTANCE_LOW);
        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        notificationManager.createNotificationChannel(channel);

        return new NotificationCompat.Builder(this, "bluetooth_channel")
                .setContentTitle("Bluetooth GATT Server Running")
                .setContentText("Your Bluetooth server is active")
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, createNotification());
        // | ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        // Initialize Bluetooth components and GATT server
        startDeviceScan();
        return START_STICKY;  // Keep the service running
    }

    private void startDeviceScan() {
        BluetoothManager mBluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter mBluetoothAdapter = mBluetoothManager.getAdapter();

        if (mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
            Log.e("GATT", "Bluetooth is not enabled");
            return;
        }


        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        String deviceName = mBluetoothAdapter.getName();
        Log.d("Bluetooth", "Device name: " + deviceName);

        BluetoothLeScanner bluetoothLeScanner = mBluetoothAdapter.getBluetoothLeScanner();
        ScanFilter scanFilter = new ScanFilter.Builder()
                .setServiceUuid(new ParcelUuid(SERVICE_UUID)) // Filter by service UUID (optional)
                .build();

        List<ScanFilter> filters = new ArrayList<>();
        filters.add(scanFilter);

        ScanSettings scanSettings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();

        bluetoothLeScanner.startScan(filters, scanSettings, new ScanCallback() {
            @Override
            public void onScanResult(int callbackType, ScanResult result) {
                BluetoothDevice device = result.getDevice();
                Log.d("scan", "found device " + device.getAddress());
                connectToDevice(device);
            }
        });
    }

    private void connectToDevice(BluetoothDevice device) {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        bluetoothGatt = device.connectGatt(getApplicationContext(), true, new BluetoothGattCallback() {
            @Override
            public void onCharacteristicChanged(@NonNull BluetoothGatt gatt, @NonNull BluetoothGattCharacteristic characteristic, @NonNull byte[] value) {
                super.onCharacteristicChanged(gatt, characteristic, value);


                String response = new String(value);

            }


            @Override
            public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
                if (newState == BluetoothProfile.STATE_CONNECTED) {
                    if (ActivityCompat.checkSelfPermission(getApplicationContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                        return;
                    }
                    gatt.discoverServices();
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    startDeviceScan();
                }
            }


            @Override
            public void onServicesDiscovered(BluetoothGatt gatt, int status) {
                if (status == GATT_SUCCESS) {
                    BluetoothGattService service = gatt.getService(SERVICE_UUID);
                    if (service != null) {
                        characteristic = service.getCharacteristic(CHAR_UUID);
                        if (ActivityCompat.checkSelfPermission(getApplicationContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                            return;
                        }
                        gatt.setCharacteristicNotification(characteristic, true);

                        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(
                                NOTIFY_DESCR);
                        if (descriptor != null) {
                            gatt.writeDescriptor(descriptor, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                        }
                    } else {
                        if (ActivityCompat.checkSelfPermission(getApplicationContext(), Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                            return;
                        }
                        gatt.discoverServices();
                    }
                } else {
                    Log.e("onServicesDiscovered", "not success " + status);
                }

            }
        });
        bluetoothGatt.connect();
    }

    public void requestBatteryOptimizationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (!pm.isIgnoringBatteryOptimizations(getPackageName())) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);  // Stop the foreground service
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        // requestBatteryOptimizationPermission();
        return mMessenger.getBinder();
    }


}
