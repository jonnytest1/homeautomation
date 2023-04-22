package com.example.jonathan.barcode;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.util.Log;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.example.jonathan.service.registration.ReceiverRegistration;
import com.example.jonathan.service.registration.Registration;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.IntNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.DataInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;

import androidx.core.app.NotificationCompat;

import static com.example.jonathan.service.registration.ReceiverRegistration.RECEIVER_ID;

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
                    if (item.get("deviceKey").asText().equals(Registration.BARCODE_SENDER_DEVICE_KEY)) {
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
            CustomResponse  updateresponse=new CustomHttp().target("https://192.168.178.54/nodets/rest/auto/receiver")
                    .request() //
                    .put(jsonNode.toString(),"application/json");
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


        String cahnnelId="123channelidsmarthome";
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this,cahnnelId);

        int importance = NotificationManager.IMPORTANCE_DEFAULT;
        NotificationChannel channel = new NotificationChannel(cahnnelId, "alert cahnnel", importance);

        String sound=messageBody.getSound();
        if(sound!=null){
            final String packageName = this.getPackageName();
            Uri target= Uri.parse("android.resource://" + packageName + "/R.raw." +sound);
            try {
                InputStream is =   new CustomHttp().target("https://192.168.178.54/nodets/rest/auto/sound/bykey/"+sound).request().getStream();
                DataInputStream dis = new DataInputStream(is);

                byte[] buffer = new byte[1024];
                int length;

                File sounds=new File(getFilesDir()+"/sounds");
                if(!sounds.exists()){
                    sounds.mkdir();
                }

                File f=new File(sounds,sound+".mp3");
                target=Uri.fromFile(f);
                if(!f.exists()){
                    f.createNewFile();
                }
                FileOutputStream fos = new FileOutputStream(f);
                while ((length = dis.read(buffer)) > 0) {
                    fos.write(buffer, 0, length);
                }
            } catch (MalformedURLException mue) {
                Log.e("SYNC getUpdate", "malformed url error", mue);
            } catch (IOException ioe) {
                Log.e("SYNC getUpdate", "io error", ioe);
            } catch (SecurityException se) {
                Log.e("SYNC getUpdate", "security error", se);
            }
            Uri uri = Uri.parse("https://192.168.178.54/nodets/rest/auto/sound/bykey/"+sound);

            AudioAttributes att = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            channel.setSound(target,att);
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



        notificationManager.createNotificationChannel(channel);

        notificationManager.notify(36346546 /* ID of notification */, notificationBuilder.build());


    }


}
