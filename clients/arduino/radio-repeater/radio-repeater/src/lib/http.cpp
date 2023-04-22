#include "http.h"
#include <WiFi.h>
#include "creds.h"
#include <HTTPClient.h>
#include "encoding.h"

String serverEndpoint()
{
    return serverHost;
}
String logEndpoint()
{
    return logHost;
}
String getDeviceKey()
{
    return deviceKey;
}
String localIp;

void waitForWifi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        return;
    }
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    String hostname = "esp32-devicekey:" + String(deviceKey);
    WiFi.setHostname(hostname.c_str());
    WiFi.begin(ssid, password);
    int t = 0;
    while (WiFi.status() != WL_CONNECTED)
    {
        t++;
        delay(100);
        Serial.println("connecting ... " + WiFi.status());
        if (t > 50)
        {
            Serial.print("Connecting failed");
            return;
        }
    }

    localIp = WiFi.localIP().toString();
    Serial.println(localIp);
}

void request(const String url, const std::map<String, String> data, void (*callback)(int httpCode, String response), boolean b64)
{
    waitForWifi();
    HTTPClient httpf;
    httpf.begin(url);

    String requestData = json(data);
    if (b64)
    {
        requestData = base64_encode(requestData);
    }
    else
    {
        httpf.addHeader("content-type", "application/json");
    }
    Serial.println(requestData);
    int httpCodef = httpf.POST(requestData);
    if (httpCodef > 0)
    {
        Serial.printf("[HTTP] POST... code: %d\n", httpCodef);
        if (callback != NULL)
        {
            callback(httpCodef, httpf.getString());
        }
    }
    else
    {
        Serial.printf("[HTTP] GET... failed, error: %s\n", httpf.errorToString(httpCodef).c_str());
    }
    httpf.end();
}

HttpServer::HttpServer(int port, String (*callback)(HttpRequest *client))
{
    wifiServer = WiFiServer(port);
    requestHandle = callback;
}

void HttpServer::begin()
{
    waitForWifi();
    wifiServer.begin();
}

void HttpServer::step()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        waitForWifi();
    }
    WiFiClient client = wifiServer.available();
    if (client)
    {
        Serial.println("New Client.");
        currentTime = millis();
        previousTime = currentTime;

        parseRequest(&client);
    }
}

String HttpServer::getIp()
{
    return localIp;
}

void HttpServer::parseRequest(WiFiClient *client)
{
    String currentLine = "";
    String header = "";
    while (client->connected() && currentTime - previousTime <= timeoutTime)
    { // loop while the client's connected
        currentTime = millis();
        if (client->available())
        {
            char c = client->read();
            header += c;
            if (c == '\n')
            {
                // if the current line is blank, you got two newline characters in a row.
                // that's the end of the client HTTP request, so send a response:
                if (currentLine.length() == 0)
                {
                    HttpRequest request = HttpRequest(header, client, requestHandle);
                    if (request.asyncSend)
                    {
                        Serial.println("keeping async open");
                        return;
                    }
                    break;
                }
                else
                { // if you got a newline, then clear currentLine
                    currentLine = "";
                }
            }
            else if (c != '\r')
            {                     // if you got anything else but a carriage return character,
                currentLine += c; // add it to the end of the currentLine
            }
        }
    }

    header = "";
    // Close the connection
    Serial.println("Client disconnected.");
    Serial.println();
}