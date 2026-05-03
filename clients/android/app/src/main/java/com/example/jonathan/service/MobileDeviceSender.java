package com.example.jonathan.service;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.time.Instant;

import static com.example.jonathan.props.Environment.BACKEND_URL;
import static com.example.jonathan.service.registration.Registration.BARCODE_SENDER_DEVICE_KEY;

public class MobileDeviceSender implements Runnable {


    private final ObjectNode content;
    private String rawResult;
    private Context applicationContext;

    String type = "barcode";

    public MobileDeviceSender(String text, Context applicationContext) {
        this.rawResult = text;
        this.content = prepareSendMessage();
        this.applicationContext = applicationContext;
    }

    ObjectNode prepareSendMessage() {
        try {
            URL url = new URL(this.rawResult);
            type = "url";
        } catch (MalformedURLException e) {
            // not an url
        }

        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();

        jsonNode.put("deviceKey", BARCODE_SENDER_DEVICE_KEY);
        jsonNode.put("timestamp", Instant.now().toString());


        jsonNode.put("type", type);
        if (type == "url") {
            jsonNode.put("url", this.rawResult);
        } else {
            jsonNode.put("message", this.rawResult);
        }

        return jsonNode;
    }


    @Override
    public void run() {
        Looper.prepare();
        //String decoded = Base64.getEncoder().encodeToString(jsonObject.toString().getBytes());
        try {
            CustomResponse response = new CustomHttp().target(BACKEND_URL + "/rest/sender/trigger")
                    .request().post(content.toString(), "application/json");
            final JsonNode responseNode = response.getJsonContent();

            if (type == "url") {

                String openUrl = this.rawResult;


                if (responseNode.has(0) && responseNode.get(0).has("newurl")) {
                    openUrl = responseNode.get(0).get("newurl").asText();
                }

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse(openUrl));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                applicationContext.startActivity(intent);
            } else {
                handleBarcodeResponse(response, responseNode);
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void handleBarcodeResponse(CustomResponse response, JsonNode responseNode) {
        if (response.getResponseCode() == 200) {
            String seconds = responseNode.get(0).get("time").asText();
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(applicationContext, Integer.valueOf(seconds) / 60 + " Minuten", Toast.LENGTH_SHORT).show();
                }
            });
        } else {
            if (response.getResponseCode() == 404) {
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(applicationContext, "didnt find timer for " + rawResult, Toast.LENGTH_SHORT).show();
                    }
                });
            }
            Log.v("idk", response.getContent()); // Prints scan results
        }
    }
}
