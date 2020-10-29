package com.example.jonathan.barcode.http;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;

public class CustomHttpRequest {

	private HttpURLConnection con;

	public CustomHttpRequest(HttpURLConnection con) {
		this.con = con;
	}

	public CustomResponse get() throws IOException {
		con.setRequestMethod("GET");
		return new CustomResponse(con);

	}

	private void setEntity(String entity, String mimeType) throws IOException {
		con.setDoOutput(true);
		if (mimeType == null) {
			con.setRequestProperty("Content-Type", "application/json");
		} else {
			con.setRequestProperty("Content-Type", mimeType);
		}

		OutputStream os = con.getOutputStream();
		BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8));
		writer.write(entity);

		writer.flush();
		writer.close();
		os.close();
	}

	public CustomResponse put(String entity, String mimeType) throws IOException {
		con.setRequestMethod("PUT");

		setEntity(entity, mimeType);
		return new CustomResponse(con);
	}

	public CustomResponse post(String entity, String mimeType) throws IOException {
		con.setRequestMethod("POST");

		setEntity(entity, mimeType);
		return new CustomResponse(con);

	}

}
