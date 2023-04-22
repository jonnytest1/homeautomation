#include <Arduino.h>
#include <map>
#include "lib/uuid.h"
#include "lib/encoding.h"
#include "lib/http.h"
#include "lib/http_request.h"
#include "lib/log.h"
#include "ArduinoOTA.h"

#define PORT 80

int pinState = LOW;
int valvePin = 16;
int requestCount = 0;
int enabledCounter = -1;

unsigned long lastLoopMillis = millis();
unsigned long deltaMillis = 0;
String deviceKey = "water-supply";

String onRequest(HttpRequest *request)
{
    requestCount++;
    String response = "";
    if (request->path.startsWith("/healthcheck"))
    {
        response = "ok" + String(requestCount);
    }
    else if (request->path.startsWith("/open"))
    {
        digitalWrite(valvePin, HIGH);
        response = "opened " + String(requestCount);
        enabledCounter = 1000 * 10;
    }
    else if (request->path.startsWith("/close"))
    {
        digitalWrite(valvePin, LOW);
        response = "closed" + String(requestCount);
    }
    else
    {
        request->sendHeader(501, response.length());
    }
    return response;
}

HttpServer server(PORT, onRequest);

void triggerHandler(int code, String data)
{
    if (code != HTTP_CODE_OK && code != 409)
    {
        Serial.println(data);
        logData("ERROR", "error in request", {{"application", deviceKey}, {"code", String(code)}, {"error", data}});
    }
}

void setup()
{
    Serial.begin(115200);
    Serial.println("start");

    String otaPassword = generateUuid();
    pinMode(valvePin, OUTPUT);

    Serial.println("ota password: " + otaPassword);
    Serial.println(serverEndpoint());
    server.begin();
    logData("INFO", "startup log", {{"application", deviceKey}, {"otaPassword", otaPassword}, {"ip", server.getIp()}});
    request("https://192.168.178.54/nodets/rest/receiver", {
                                                               {"deviceKey", deviceKey.c_str()},
                                                               {"port", String(PORT).c_str()},
                                                               {"type", "http"},
                                                               {"name", "water supply"},
                                                               {"description", "refill water"},
                                                           },
            triggerHandler, false);
    // put your setup code here, to run once:
    ArduinoOTA.setHostname(("esp32-" + deviceKey + "_ota").c_str());
    ArduinoOTA.setPassword(otaPassword.c_str());
    ArduinoOTA.begin();
}

void loop()
{
    server.step();
    ArduinoOTA.handle();
    if (enabledCounter > 0)
    {
        enabledCounter -= deltaMillis;
        if (enabledCounter <= 0)
        {
            Serial.println("switched off");
            digitalWrite(valvePin, LOW);
        }
    }
    deltaMillis = millis() - lastLoopMillis;
    lastLoopMillis = millis();
}