package com.example.jonathan.barcode.http;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public class CustomResponse {

	private int responseCode;

	private String content;

	private Map<String, List<String>> headers = new HashMap<>();

	private HttpURLConnection con;

	public CustomResponse(int responseCode, String content) {
		this.responseCode = responseCode;
		this.content = content;
	}

	public CustomResponse(HttpURLConnection con) throws IOException {
		this.con = con;
		try {
			responseCode = con.getResponseCode();
			headers = con.getHeaderFields();
			content = readEntity();
		} catch (IOException e) {
			if (e instanceof UnknownHostException) {
				throw e;
			}
		}
		con.disconnect();
	}

	public int getResponseCode() {
		return responseCode;
	}

	public String getContent() {
		return content;
	}

	public JsonNode getJsonContent() throws JsonProcessingException {
		return new ObjectMapper().readTree(content);
	}

	private String readEntity() throws IOException {

		InputStream is;
		if (responseCode > 399) {
			is = con.getErrorStream();
		} else {
			is = con.getInputStream();
		}
		if (is == null) {
			return null;
		}
		BufferedReader in = new BufferedReader(new InputStreamReader(is));
		String inputLine;
		StringBuilder builder = new StringBuilder();
		while ((inputLine = in.readLine()) != null) {
			builder.append(inputLine + "\n");
		}
		in.close();
		return builder.toString();

	}

	public Map<String, List<String>> getHeaders() {
		return headers;
	}

	public void setHeaders(Map<String, List<String>> headers) {
		this.headers = headers;
	}

}
