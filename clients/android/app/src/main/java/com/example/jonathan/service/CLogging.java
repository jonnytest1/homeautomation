package com.example.jonathan.service;

import android.util.Base64;
import android.util.Log;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.example.jonathan.props.Environment;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static com.example.jonathan.service.registration.Registration.BARCODE_SENDER_DEVICE_KEY;
import static java.util.Map.of;

public class Logging {

    public enum LogLevel{
        ERROR,WARN,INFO,DEBUG
    }
    static void log(LogLevel level,String message){
        log(level, of("message",message),null);
    }

    static void log(LogLevel level,String message,Throwable t){
        log(level, of("message",message),t);
    }
    static void log(LogLevel level, Map<String,String> props){
        log(level, props,null);
    }


    static void log(LogLevel level, Map<String,String> props,Throwable t){
        ObjectNode jsonNode = new ObjectMapper() //
                .createObjectNode();
        jsonNode.set("application",new TextNode(BARCODE_SENDER_DEVICE_KEY));
        jsonNode.set("Severity",new TextNode(level.name()));

        props.forEach((k,v)->{
            jsonNode.set(k,new TextNode(v));
        });

        if(t!=null){
            jsonNode.set("error_message",new TextNode(t.getMessage()));
            jsonNode.set("error_stacktrace",new TextNode(StackPrint.getStackTrace(t)));
        }

        try {
            String jsonStr=jsonNode.toString();
            String base64Str= Base64.encodeToString(jsonStr.getBytes(StandardCharsets.UTF_8), Base64.DEFAULT);
            CustomResponse postResponse=new CustomHttp().target(Environment.LOG_ENDPOINT)
                    .request() //
                    .post(base64Str,"text/plain");
        } catch (IOException e) {
            Log.e("LOG_FAIL","failed request to log",e);
        }
    }
}
