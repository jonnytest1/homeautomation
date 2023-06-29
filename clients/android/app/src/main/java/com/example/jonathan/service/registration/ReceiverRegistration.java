package com.example.jonathan.service.registration;

import android.os.Build;
import android.util.Log;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;

import java.util.concurrent.Callable;

import static com.example.jonathan.service.registration.Registration.getReceiverDeviceName;

public class ReceiverRegistration implements Callable<Void> {
    private static final String TAG = "ReceiverRegistration";

    public static Integer RECEIVER_ID=null;
    public String token=null;
    @Override
    public Void call() throws Exception {
        Log.d(TAG,"registering device");
        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();
        jsonNode.set("deviceKey",new TextNode(getReceiverDeviceName()));

        String name="Mobile Receiver";
        String description="Receiver auf dem Smartphone";
        if(Build.MODEL.equals("SM-X200")){
            name="Tablet Receiver";
            description="REceiver auf Tablet";

        }
        jsonNode.set("name",new TextNode(name));
        jsonNode.set("description",new TextNode(description));
        jsonNode.set("type",new TextNode("firebase"));
        jsonNode.set("firebaseToken",this.token==null?NullNode.getInstance(): new TextNode(this.token));
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
