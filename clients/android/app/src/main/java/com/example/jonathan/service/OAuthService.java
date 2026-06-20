package com.example.jonathan.service;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;

import com.example.jonathan.http.CustomHttp;
import com.example.jonathan.http.CustomResponse;
import com.fasterxml.jackson.databind.JsonNode;

import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.concurrent.CompletableFuture;

import static android.content.Intent.FLAG_ACTIVITY_NEW_TASK;
import static com.example.jonathan.props.Environment.AUTH_ENDPOINT;

public class OAuthService {

    private static CompletableFuture<String> tokenFuture;
    private static final String TOKEN_CACHE_KEY = "remote_token";
    private static final String TOKEN_CACHE_KEY_REFRESH = "remote_refresh_token";
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final String CODE_VERIFIER_CHARSET =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
                    "abcdefghijklmnopqrstuvwxyz" +
                    "0123456789" +
                    "-._~";

    private static String verifier;

    private static final String redirectUri = "smapp://oauth/callback";


    private static boolean isExpired(String jwt) {

        try {

            String[] parts = jwt.split("\\.");

            String payloadJson = new String(
                    Base64.decode(
                            parts[1],
                            Base64.URL_SAFE
                    ),
                    StandardCharsets.UTF_8
            );

            JSONObject payload =
                    new JSONObject(payloadJson);

            if (!payload.has("exp")) {
                return false;
            }

            long exp =
                    payload.getLong("exp");

            long now =
                    System.currentTimeMillis() / 1000;

            return now >= exp;

        } catch (Exception e) {
            return true;
        }
    }

    public static String generateCodeVerifier() {
        byte[] code = new byte[32]; // 32 bytes -> good balance of length/entropy
        secureRandom.nextBytes(code);
        int length = 128;
        StringBuilder codeVerifier = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            int randomIndex = secureRandom.nextInt(CODE_VERIFIER_CHARSET.length());
            codeVerifier.append(CODE_VERIFIER_CHARSET.charAt(randomIndex));
        }

        return codeVerifier.toString();
    }

    public static String generateCodeChallenge(String codeVerifier) {
        try {
            byte[] bytes = codeVerifier.getBytes("US-ASCII");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);

            return Base64.encodeToString(
                    hash,
                    Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP
            );


        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static CompletableFuture<String> refreshAccessToken(String refreshToken) {
        CompletableFuture<String> accessTokenFuture = new CompletableFuture<>();
        new Thread(() -> {
            try {
                CustomResponse response = new CustomHttp()
                        .target(AUTH_ENDPOINT + "/token"
                        )
                        .request()
                        .post("grant_type=refresh_token&client_id=account&refresh_token=" + Uri.encode(refreshToken), "application/x-www-form-urlencoded");

                JsonNode jsonResp = response.getJsonContent();
                accessTokenFuture.complete(jsonResp.get("access_token").textValue());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }).start();

        return accessTokenFuture;
    }

    public static CompletableFuture<String> getAccessToken(Context appContext) {
        tokenFuture = new CompletableFuture<>();
        SharedPreferences prefs = appContext.getSharedPreferences("data", Context.MODE_PRIVATE);
        String token = prefs.getString(OAuthService.TOKEN_CACHE_KEY, null);
        if (token != null) {
            if (!isExpired(token)) {
                return CompletableFuture.completedFuture(token);
            }
        }
        String refreshToken = prefs.getString(OAuthService.TOKEN_CACHE_KEY_REFRESH, null);
        if (refreshToken != null) {
            if (!isExpired(refreshToken)) {
                CompletableFuture<String> atFuture = refreshAccessToken(refreshToken);

                atFuture.thenAccept(accessToken -> {
                    prefs.edit().putString(OAuthService.TOKEN_CACHE_KEY, accessToken).apply();

                });
                return atFuture;
            }
        }

        verifier = generateCodeVerifier();
        String challenge = generateCodeChallenge(verifier);

        String url = AUTH_ENDPOINT + "/auth?client_id=account&code_challenge_method=S256&response_type=code&redirect_uri="
                + Uri.encode(redirectUri) + "&code_challenge=" + Uri.encode(challenge) + "&scope=" + Uri.encode("openid profile offline_access");
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        intent.setFlags(FLAG_ACTIVITY_NEW_TASK);
        appContext.startActivity(intent);

        return tokenFuture;
    }

    public static void complete(Context appContext, String code) {

        new Thread(() -> {

            try {

                CustomResponse response = new CustomHttp()
                        .target(AUTH_ENDPOINT + "/token"
                        )
                        .request()
                        .post("grant_type=authorization_code&client_id=account&code="
                                + Uri.encode(code) + "&redirect_uri=" + Uri.encode(redirectUri) + "&code_verifier=" + Uri.encode(verifier), "application/x-www-form-urlencoded");
                JsonNode jsonResp = response.getJsonContent();

                String accessToken = jsonResp.get("access_token").textValue();
                SharedPreferences prefs = appContext.getSharedPreferences("data", Context.MODE_PRIVATE);
                SharedPreferences.Editor edit = prefs.edit();
                edit.putString(TOKEN_CACHE_KEY_REFRESH, jsonResp.get("refresh_token").textValue());
                edit.putString(TOKEN_CACHE_KEY, accessToken);
                edit.commit();
                if (tokenFuture != null) {
                    tokenFuture.complete(accessToken);
                }

                Log.d("TAG", "complete: ");


            } catch (Exception e) {
                throw new RuntimeException(e);
            }


        }).start();


    }
}
