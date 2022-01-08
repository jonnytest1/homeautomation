#include <Arduino.h>
#include <HTTPClient.h>
#include "http.h"
#include <WiFi.h>

String deviceKey = "lamp-component";
int pinState = LOW;
#define PORT 80

String onRequest(String header, WiFiClient client)
{
    pinState = pinState == LOW ? HIGH : LOW;

    digitalWrite(12, pinState);

    return "currently " + String(pinState);
}

HttpServer server(PORT, onRequest);

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
    server.begin();
}

void triggerHandler(int code, String data)
{
    if (code != HTTP_CODE_OK && code != 409)
    {
        Serial.println(data);
        request("https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php", {{"application", deviceKey}, {"Severity", "ERROR"}, {"message", "error in request"}, {"code", String(code)}, {"error", data}}, NULL, true);
    }
}

void loop()
{
    Serial.println("lop");
    server.step();
}
