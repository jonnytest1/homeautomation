package com.example.jonathan.service;

import android.content.Context;
import android.os.Looper;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.time.Instant;

public abstract class Sender  {
    protected final Context applicationContext;
    protected ObjectNode content;
    protected JsonNode responseNode;
    protected CustomResponse response;

    public Sender(Context applicationContext) {
        this.applicationContext = applicationContext;
    }


    abstract void prepareSendMessage(ObjectNode defaultNode);

    public void send() throws IOException {
        Looper.prepare();

        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();
        jsonNode.put("timestamp", Instant.now().toString());
        this.prepareSendMessage(jsonNode);

        response = new CustomHttp().target("https://192.168.178.54/nodets/rest/sender/trigger")
                .request().post(content.toString(), "application/json");
        responseNode=response.getJsonContent();
    }

}
