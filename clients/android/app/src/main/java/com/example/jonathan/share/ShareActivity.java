package com.example.jonathan.share;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;

import com.example.jonathan.barcode.R;
import com.example.jonathan.service.ShareSender;

import androidx.annotation.Nullable;

public class ShareActivity extends Activity {

    String sharedText;




    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sharedText=null;
        setContentView(R.layout.share);

        Spinner dropdown =findViewById(R.id.actionDropDown);
        dropdown.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"openUrl"}));

        Intent intent = getIntent();
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            if ("text/plain".equals(type)) {
                sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                if (sharedText != null) {
                    TextView textView =  (TextView) findViewById(R.id.titleText);
                    textView.setText(sharedText);
                }
            } else if (type.startsWith("image/")) {
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            if (type.startsWith("image/")) {
            }
        }

        Button submitButton = (Button) findViewById(R.id.sendButton);
        submitButton.setOnClickListener((View view)->{
            if(sharedText!=null) {
                new Thread(new ShareSender(sharedText,dropdown.getSelectedItem().toString(),getApplicationContext())).start();
            }
        });
    }
}
