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
import com.example.jonathan.barcode.service.registration.ReceiverRegistration;
import com.example.jonathan.barcode.service.registration.Registration;
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

import static com.example.jonathan.barcode.service.registration.ReceiverRegistration.RECEIVER_ID;

public class MessagingService extends FirebaseMessagingService  {
    private static final String TAG = "MyFirebaseMsgService";


    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains a data payload.
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());


            // Handle message within 10 seconds
            //handleNow();
        }

        // Check if message contains a notification payload.
        if (remoteMessage.getNotification() != null) {
            sendNotification(remoteMessage.getNotification());
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
            if(RECEIVER_ID==null) {
                CustomResponse  response=new CustomHttp().target("https://192.168.178.54/nodets/rest/receiver").request().get();
                String content=response.getContent();

                ArrayNode node =(ArrayNode) new ObjectMapper().readTree(content);
                for (JsonNode item : node) {
                    if (item.get("deviceKey").asText().equals(Registration.DEVICE_KEY)) {
                        RECEIVER_ID = item.get("id").asInt();
                    }
                }
            }
            if(RECEIVER_ID==null){
                try {
                    new ReceiverRegistration().call();
                } catch (Exception e) {
                    return;
                }
            }

            Log.d(TAG,"updating token");
            ObjectNode jsonNode = new ObjectMapper() //
                    .createObjectNode();
            jsonNode.set("firebaseToken",new TextNode(token));
            jsonNode.set("itemRef",new IntNode(RECEIVER_ID));
            CustomResponse  updateresponse=new CustomHttp().target("https://192.168.178.54/nodets/rest/receiver")
                    .request() //
                    .put(jsonNode .toString(),"application/json");
            if(updateresponse.getResponseCode()!=200){
                Log.e(TAG,"failed updating reeiver"+"\n"+updateresponse.getResponseCode()+"\n"+updateresponse.getContent());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void sendNotification(RemoteMessage.Notification messageBody) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 /* Request code */, intent,
                PendingIntent.FLAG_ONE_SHOT);

        String channelId = "fcm_default_channel";

        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, channelId);

        String sound=messageBody.getSound();
        if(sound!=null){
            Uri uri = Uri.parse(sound);
            notificationBuilder.setSound(uri);
        }else{
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            notificationBuilder.setSound(defaultSoundUri);
        }

        if(messageBody.getTitle()!=null){
            notificationBuilder.setContentTitle(messageBody.getTitle());
        }
        if(messageBody.getBody()!=null){
            notificationBuilder.setContentText(messageBody.getBody());
        }
        String icon=messageBody.getIcon();
        if(icon!=null){
            //TODO
            notificationBuilder.setSmallIcon(R.drawable.common_full_open_on_phone);
        }else{
            notificationBuilder.setSmallIcon(R.drawable.common_full_open_on_phone);
        }

        notificationBuilder.setAutoCancel(true);
        notificationBuilder.setContentIntent(pendingIntent);

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
