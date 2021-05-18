package com.example.jonathan.service.registration;

import android.util.Log;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;

import java.util.concurrent.Callable;

import static com.example.jonathan.service.registration.Registration.SHARE_URL_SENDER_DEVICE_KEY;

public class ShareSenderRegistration  implements Callable<Void> {

    public static int SHARE_SENDER_ID;

    private static final String TAG = "ShareSenderRegistration";
    @Override
    public Void call() throws Exception {
        Log.d(TAG,"registering device");
        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();
        jsonNode.set("deviceKey",new TextNode(SHARE_URL_SENDER_DEVICE_KEY));
        jsonNode.set("name",new TextNode("Mobile Share Sender"));
        jsonNode.set("description",new TextNode("Share Sender auf dem Smartphone"));
        CustomResponse postResponse=new CustomHttp().target("https://192.168.178.54/nodets/rest/sender")
                .request() //
                .post(jsonNode.toString(),"application/json");
        if (postResponse.getResponseCode() == 200||postResponse.getResponseCode() == 409) {
            SHARE_SENDER_ID = new ObjectMapper().readTree(postResponse.getContent()).get("id").asInt();
        } else {
            Log.e(TAG,"failed creating receiver"+"\n"+postResponse.getResponseCode()+"\n"+postResponse.getContent());
        }
        return null;
    }
}
