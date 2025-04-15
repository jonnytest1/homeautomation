package com.example.jonathan.barcode;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.jonathan.service.CLogging;
import com.example.jonathan.service.registration.ReceiverRegistration;
import com.google.firebase.messaging.FirebaseMessaging;

import androidx.fragment.app.Fragment;

/**
 * A fragment representing a list of Items.
 */
public class DebugFragment extends Fragment {

    // TODO: Customize parameter argument names
    private static final String ARG_COLUMN_COUNT = "column-count";
    // TODO: Customize parameters
    private int mColumnCount = 1;

    public DebugFragment() {
    }

    public static DebugFragment newInstance(int columnCount) {
        DebugFragment fragment = new DebugFragment();
        Bundle args = new Bundle();
        args.putInt(ARG_COLUMN_COUNT, columnCount);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getArguments() != null) {
            mColumnCount = getArguments().getInt(ARG_COLUMN_COUNT);
        }
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.debug_view, container, false);
        view.findViewById(R.id.firebaseupdate).setOnClickListener((e) -> {

            FirebaseMessaging.getInstance().deleteToken().onSuccessTask(runnable -> {
                return FirebaseMessaging.getInstance().getToken();
            }).addOnCompleteListener(str -> {
                new Thread(() -> {
                    try {
                        ReceiverRegistration rReg = new ReceiverRegistration();
                        rReg.token = str.getResult();
                        rReg.call();
                    } catch (Exception ex) {
                        Log.e("exception", "exception updating token", ex);
                        ex.printStackTrace();
                    }
                }).start();
            }).addOnFailureListener(failure -> {
                Log.e("exception", "exception updating token", failure);
            });
        });
        view.findViewById(R.id.logtest).setOnClickListener((e) -> {

            CLogging.log(CLogging.LogLevel.ERROR, "test error log");
        });
        return view;
    }
}