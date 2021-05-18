package com.example.jonathan.barcode;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import com.example.jonathan.service.registration.Registration;

import java.time.Instant;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.widget.ViewPager2;
import me.dm7.barcodescanner.zxing.ZXingScannerView;

public class MainActivity extends FragmentActivity {
    private ZXingScannerView mScannerView;

    private Instant lastSend=Instant.ofEpochMilli(0);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        new Registration(getApplicationContext()).checkRegistration();
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        if(ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)!= PackageManager.PERMISSION_GRANTED){
            ActivityCompat.requestPermissions(this,new String[]{Manifest.permission.CAMERA},1);
        };

       PagerAdapter  pagerAdapter = new PagerAdapter(this);
        ViewPager2 viewPager = findViewById(R.id.viewPager2);
        viewPager.setAdapter(pagerAdapter);
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    @Override
    public void onPause() {
        super.onPause();
    }
}