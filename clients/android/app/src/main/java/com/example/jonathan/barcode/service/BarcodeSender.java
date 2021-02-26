package com.example.jonathan.barcode.service;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import com.example.jonathan.barcode.http.CustomHttp;
import com.example.jonathan.barcode.http.CustomResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.zxing.Result;

import java.io.IOException;
import java.time.Instant;

import static com.example.jonathan.barcode.service.registration.Registration.DEVICE_KEY;

public class BarcodeSender implements Runnable {


    private final ObjectNode content;
    private String rawResult;
    private Context applicationContext;

    public BarcodeSender(Result rawResult, Context applicationContext) {
        this.rawResult = rawResult.getText();
        this.content=prepareSendMessage();
        this.applicationContext = applicationContext;
    }

    ObjectNode prepareSendMessage(){
        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();
        jsonNode.put("deviceKey",DEVICE_KEY);
        jsonNode.put("timestamp", Instant.now().toString());
        jsonNode.put("message", this.rawResult);
        return jsonNode;
    }


    @Override
    public void run() {
        Looper.prepare();
        //String decoded = Base64.getEncoder().encodeToString(jsonObject.toString().getBytes());
        try {
            CustomResponse response = new CustomHttp().target("https://192.168.178.54/nodets/rest/sender/trigger")
                    .request().post(content.toString(), "application/json");
            final JsonNode responseNode=response.getJsonContent();
            if (response.getResponseCode() == 200) {
                String seconds=responseNode.get(0).get("time").asText();
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(applicationContext, Integer.valueOf(seconds)/60 +" Minuten", Toast.LENGTH_SHORT).show();
                    }
                });
            } else {
                if(response.getResponseCode()==404){
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(applicationContext, "didnt find timer for "+rawResult, Toast.LENGTH_SHORT).show();
                        }
                    });
                }
                Log.v("idk", response.getContent()); // Prints scan results
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
