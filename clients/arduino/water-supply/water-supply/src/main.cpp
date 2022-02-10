#include <Arduino.h>
#include <map>
#include "uuid.h"
#include "encoding.h"
#include "http.h"
#include "log.h"
#include "ArduinoOTA.h"

#define PORT 80

int pinState = LOW;
int valvePin = 12;
int requestCount = 0;

String deviceKey = "water-supply";

String onRequest(String header, WiFiClient client)
{
    requestCount++;
    String response = "";
    if (header.startsWith("GET /healthcheck"))
    {
        response = "ok" + String(requestCount);
    }
    else if (header.startsWith("GET /open"))
    {
        digitalWrite(valvePin, HIGH);
        response = "opened " + String(requestCount);
    }
    else if (header.startsWith("GET /close"))
    {
        digitalWrite(valvePin, LOW);
        response = "closed" + String(requestCount);
    }
    else
    {
        response = "http:501";
    }
    return response;
}

HttpServer server(PORT, onRequest);

void setup()
{
    Serial.begin(9600);
    Serial.println("start");
    String otaPassword = generateUuid();
    pinMode(valvePin, OUTPUT);

    Serial.println("ota password: " + otaPassword);
    Serial.println(serverEndpoint());
    server.begin();
    logData("info", deviceKey + " startup log", {{"application", deviceKey}, {"otaPassword", otaPassword}, {"ip", server.getIp()}});
    // put your setup code here, to run once:
    ArduinoOTA.setHostname(("esp32-" + deviceKey + "_ota").c_str());
    ArduinoOTA.setPassword(otaPassword.c_str());
    ArduinoOTA.begin();
}

void loop()
{
    server.step();
    ArduinoOTA.handle();
}