package com.example.jonathan.barcode.service.registration;

import android.util.Log;

import com.example.jonathan.barcode.http.CustomHttp;
import com.example.jonathan.barcode.http.CustomResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;

import java.util.concurrent.Callable;

import static com.example.jonathan.barcode.service.registration.Registration.DEVICE_KEY;

public class ReceiverRegistration implements Callable<Void> {
    private static final String TAG = "ReceiverRegistration";

    public static Integer RECEIVER_ID=null;

    @Override
    public Void call() throws Exception {
        Log.d(TAG,"registering device");
        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();
        jsonNode.set("deviceKey",new TextNode(DEVICE_KEY));
        jsonNode.set("name",new TextNode("Mobile Receiver"));
        jsonNode.set("description",new TextNode("Receiver auf dem Smartphone"));
        CustomResponse postResponse=new CustomHttp().target("https://192.168.178.54/nodets/rest/receiver")
                .request() //
                .post(jsonNode.toString(),"application/json");
        if (postResponse.getResponseCode() == 200 ||postResponse.getResponseCode() == 409) {
            RECEIVER_ID= new ObjectMapper().readTree(postResponse.getContent()).get("id").asInt();
        } else {
            Log.e(TAG,"failed creating receiver"+"\n"+postResponse.getResponseCode()+"\n"+postResponse.getContent());
        }
        return null;
    }
}
