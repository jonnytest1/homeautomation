package com.example.jonathan.barcode;

import android.content.Context;
import android.os.Bundle;
import android.os.Looper;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

import com.example.jonathan.barcode.http.CustomHttp;
import com.example.jonathan.barcode.http.CustomResponse;
import com.google.zxing.Result;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.time.Instant;
import java.util.Base64;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import me.dm7.barcodescanner.zxing.ZXingScannerView;

public class MainActivity extends AppCompatActivity implements ZXingScannerView.ResultHandler {
    private ZXingScannerView mScannerView;

    private Instant lastSend=Instant.ofEpochMilli(0);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //setContentView(R.layout.activity_main);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        mScannerView = new ZXingScannerView(this);   // Programmatically initialize the scanner view
        setContentView(mScannerView);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (mScannerView != null) {
            mScannerView.setResultHandler(this); // Register ourselves as a handler for scan results.
            mScannerView.startCamera();
        }// Start camera on resume
    }

    @Override
    public void onPause() {
        super.onPause();
        mScannerView.stopCamera();           // Stop camera on pause
    }

    @Override
    public void handleResult(Result rawResult) {
        // Do something with the result here
        if(lastSend.isBefore(Instant.now().minusSeconds(5))){
            lastSend=Instant.now();
            final JSONObject jsonObject = new JSONObject();
            try {
                jsonObject.put("application", "android timer");
                jsonObject.put("Severity", "TIMER");
                jsonObject.put("timestamp", Instant.now().toString());
                jsonObject.put("message", rawResult.getText());
            } catch (JSONException e) {
                e.printStackTrace();
            }
            final String result=rawResult.getText();

            final Context applicationContext = getBaseContext();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    Looper.prepare();
                    String decoded = Base64.getEncoder().encodeToString(jsonObject.toString().getBytes());
                    try {
                        CustomResponse response = new CustomHttp().target("https://192.168.178.54/nodets/rest/timer").request().post(result, "text/plain");
                        final String responseText=response.getContent();
                        if (response.getResponseCode() != 200) {
                            if(response.getResponseCode()==404){
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(applicationContext, "didnt find timer for "+result, Toast.LENGTH_SHORT).show();
                                    }
                                });
                            }
                            Log.v("idk", response.getContent()); // Prints scan results
                        }else {
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    Toast.makeText(applicationContext, responseText.trim(), Toast.LENGTH_SHORT).show();
                                }
                            });
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }).start();
        }
        // If you would like to resume scanning, call this method below:
        mScannerView.resumeCameraPreview(this);
    }
}