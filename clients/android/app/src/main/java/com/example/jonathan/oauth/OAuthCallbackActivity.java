package com.example.jonathan.oauth;

import android.net.Uri;
import android.os.Bundle;

import com.example.jonathan.http.UrlUtils;
import com.example.jonathan.service.OAuthService;

import java.util.Map;

import androidx.appcompat.app.AppCompatActivity;

public class OAuthCallbackActivity extends AppCompatActivity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Uri uri = getIntent().getData();

        if (uri != null) {

            Map<String, String> params = UrlUtils.getQueryParams(uri);


            if (params.containsKey("code")) {
                OAuthService.complete(getApplicationContext(), params.get("code"));

            }
        }

        finish();
    }

}