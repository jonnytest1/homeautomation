package com.example.jonathan.service;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;

import static com.example.jonathan.service.registration.Registration.SHARE_URL_SENDER_DEVICE_KEY;

public class ShareSender extends Sender implements Runnable  {


    private final String url;
    private String action;

    public ShareSender(String url,String action, Context applicationContext) {
        super(applicationContext);
        this.url = url;
        this.action = action;
    }

    @Override
    void prepareSendMessage(ObjectNode node) {
        node.put("deviceKey", SHARE_URL_SENDER_DEVICE_KEY);
        node.put("data",url);
        node.put("action",action);
    }

    @Override
    public void run() {

        try {
            send();
            if(response.getResponseCode()!=200){
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(applicationContext, "failed to open url", Toast.LENGTH_SHORT).show();
                    }
                });
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
