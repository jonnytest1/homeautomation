package com.example.jonathan.barcode;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.example.jonathan.barcode.http.CustomHttp;
import com.example.jonathan.barcode.http.CustomResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.IntNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.IOException;

import androidx.core.app.NotificationCompat;

public class MessagingService extends FirebaseMessagingService  {
    private static final String TAG = "MyFirebaseMsgService";

    private static final String DEVICE_KEY ="mobile-device";

    private static Integer RECEIVER_ID=null;
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains a data payload.
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());


            // Handle message within 10 seconds
            //handleNow();
            sendNotification("test");
        }

        // Check if message contains a notification payload.
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);

        sendRegistrationToServer(token);
    }

    private void sendRegistrationToServer(String token) {
        try {
            CustomResponse  response=new CustomHttp().target("https://192.168.178.54/nodets/rest/receiver").request().get();
            String content=response.getContent();

            ArrayNode node =(ArrayNode) new ObjectMapper().readTree(content);

            if(RECEIVER_ID==null) {
                for (JsonNode item : node) {
                    if (item.get("deviceKey").asText().equals("DEVICE_ID")) {
                        RECEIVER_ID = item.get("id").asInt();
                    }
                }
            }
            if(RECEIVER_ID!=null){
                Log.d(TAG,"updating token");
                ObjectNode jsonNode = new ObjectMapper() //
                        .createObjectNode();
                jsonNode.set("firebaseToken",new TextNode(token));
                jsonNode.set("itemRef",new IntNode(RECEIVER_ID));
                CustomResponse  updateresponse=new CustomHttp().target("https://192.168.178.54/nodets/rest/receiver")
                        .request() //
                        .put(jsonNode .toString(),"application/json");
                if(response.getResponseCode()!=200){
                    Log.e(TAG,"failed updating reeiver"+"\n"+response.getResponseCode()+"\n"+response.getContent());
                }
            }else{
                Log.d(TAG,"registering device");
                ObjectNode jsonNode = new ObjectMapper() //
                        .createObjectNode();
                jsonNode.set("firebaseToken",new TextNode(token));
                jsonNode.set("deviceKey",new TextNode(DEVICE_KEY));
                jsonNode.set("name",new TextNode("Mobile Receiver"));
                jsonNode.set("description",new TextNode("Receiver auf dem Smartphone"));
                CustomResponse  postResponse=new CustomHttp().target("https://192.168.178.54/nodets/rest/receiver")
                        .request() //
                        .post(jsonNode.toString(),"application/json");
                if(response.getResponseCode()!=200){
                    Log.e(TAG,"failed creating receiver"+"\n"+response.getResponseCode()+"\n"+response.getContent());
                }else{
                    RECEIVER_ID= new ObjectMapper().readTree(postResponse.getContent()).get("id").asInt();
                }
            }


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void sendNotification(String messageBody) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 /* Request code */, intent,
                PendingIntent.FLAG_ONE_SHOT);

        String channelId = "fcm_default_channel";
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, channelId)
                        .setSmallIcon(R.drawable.common_full_open_on_phone)
                     //   .setContentTitle(getString(R.string.fcm_message))
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setContentIntent(pendingIntent);

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Since android Oreo notification channel is needed.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId,
                    "Channel human readable title",
                    NotificationManager.IMPORTANCE_DEFAULT);
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify(0 /* ID of notification */, notificationBuilder.build());
    }
}
