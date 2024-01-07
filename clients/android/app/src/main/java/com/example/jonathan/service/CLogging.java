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
import java.util.HashMap;
import java.util.Map;

import static com.example.jonathan.service.registration.Registration.getReceiverDeviceName;
import static java.util.Map.of;

public class CLogging {

    public enum LogLevel{
        ERROR,WARN,INFO,DEBUG
    }
    public  static void log(LogLevel level,String message){
        log(level, of("message",message),null);
    }

    public  static void log(LogLevel level,String message,Throwable t){
        log(level, of("message",message),t);
    }
    public static void log(LogLevel level, Map<String,String> props){
        log(level, props,null);
    }
    public static void log(LogLevel level, Map<String,String> props,Throwable t){
        log(level, props,t,0);
    }
   private static void log(LogLevel level, Map<String,String> props,Throwable t,int logCt){
        new Thread(()->{
            try {
                ObjectNode jsonNode = new ObjectMapper() //
                        .createObjectNode();
                jsonNode.set("application",new TextNode("app"));
                jsonNode.set("deviceKey",new TextNode(getReceiverDeviceName()));
                jsonNode.set("Severity",new TextNode(level.name()));

                props.forEach((k,v)->{
                    jsonNode.set(k,new TextNode(v));
                });

                if(t!=null){
                    jsonNode.set("error_message",new TextNode(t.getMessage()));
                    jsonNode.set("error_stacktrace",new TextNode(StackPrint.getStackTrace(t)));
                }
                String jsonStr=jsonNode.toString();
                String base64Str= Base64.encodeToString(jsonStr.getBytes(StandardCharsets.UTF_8), Base64.DEFAULT);
                CustomResponse postResponse=new CustomHttp().target(Environment.LOG_ENDPOINT)
                        .request() //
                        .post(base64Str,"text/plain");
            } catch (IOException e) {
                if(logCt==0){
                    if(t!=null) {
                        e.initCause(t);
                    }
                    Map<String,String>propMap=new HashMap<>();
                    propMap.put("message","error while logging");
                    log(LogLevel.ERROR,  propMap,e,1);
                }
                Log.e("LOG_FAIL","failed request to log",e);
            }
        }).start();
    }
}
