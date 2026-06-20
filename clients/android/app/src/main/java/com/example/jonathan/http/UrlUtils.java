package com.example.jonathan.http;

import android.net.Uri;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UrlUtils {

    public static Map<String, String> getQueryParams(Uri uri) {
      

        Map<String, String> params = new HashMap<>();

        for (String key : uri.getQueryParameterNames()) {
            List<String> values = uri.getQueryParameters(key);

            if (values != null && !values.isEmpty()) {
                params.put(key, values.get(0)); // first value only
            }
        }

        return params;
    }
}
