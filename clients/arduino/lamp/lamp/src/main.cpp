#include <Arduino.h>
#include <HTTPClient.h>
#include "lib/http.h"
#include <WiFi.h>
#include "lib/log.h"
#include "lib/uuid.h"
#include "ArduinoOTA.h"

String deviceKey = "lamp-component";
int pinState = LOW;
#define PORT 80

String onRequest(HttpRequest *client)
{
    pinState = pinState == LOW ? HIGH : LOW;
    digitalWrite(12, pinState);

    return "currently " + String(pinState);
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
    delay(1000);
    // put your setup code here, to run once:
    Serial.begin(9600);
    Serial.println("start");
    pinMode(12, OUTPUT);
    digitalWrite(12, pinState);

    request("https://192.168.178.54/nodets/rest/receiver", {
                                                               {"deviceKey", deviceKey.c_str()},
                                                               {"port", String(PORT).c_str()},
                                                               {"type", "http"},
                                                               {"name", "lamp"},
                                                               {"description", "toggle lamp on and off"},
                                                           },
            triggerHandler, false);
    Serial.println("");
    Serial.println("WiFi connected.");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    String otaPassword = generateUuid();
    logData("INFO", " startup log", {
                                        {"application", deviceKey},
                                        {"otaPassword", otaPassword},
                                        {"ip", server.getIp()},
                                    });
    server.begin();

    ArduinoOTA.setHostname(("esp32-" + deviceKey + "_ota").c_str());
    ArduinoOTA.setPassword(otaPassword.c_str());
    ArduinoOTA.begin();
}

void loop()
{
    server.step();
    ArduinoOTA.handle();
}
