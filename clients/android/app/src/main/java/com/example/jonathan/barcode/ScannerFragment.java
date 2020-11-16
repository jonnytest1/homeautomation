package com.example.jonathan.barcode;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.jonathan.barcode.service.BarcodeSender;
import com.google.zxing.Result;

import java.time.Instant;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import me.dm7.barcodescanner.zxing.ZXingScannerView;

public class ScannerFragment extends Fragment implements ZXingScannerView.ResultHandler {

    private ZXingScannerView mScannerView;
    private Instant lastSend=Instant.ofEpochMilli(0);

    @Override
    public View onCreateView(
            LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState
    ) {

        mScannerView = new ZXingScannerView(getContext());   // Programmatically initialize the scanner view
        // Inflate the layout for this fragment
        return mScannerView;
    }

    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

       /* view.findViewById(R.id.button_first).setOnClickListener(view1 -> //
                NavHostFragment.findNavController(ScannerFragment.this)
                    .navigate(R.id.action_FirstFragment_to_SecondFragment));*/
    }

    @Override
    public void onResume() {
        super.onResume();
        if (mScannerView != null) {
            mScannerView.setResultHandler(this);
            mScannerView.startCamera();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mScannerView != null) {
            mScannerView.stopCamera();
        }
    }

    @Override
    public void handleResult(Result rawResult) {
        if(lastSend.isBefore(Instant.now().minusSeconds(5))){
            lastSend=Instant.now();
            new Thread(new BarcodeSender(rawResult,getContext().getApplicationContext())).start();
        }
        mScannerView.resumeCameraPreview(this);
    }
}