#include <Arduino.h>
#include <map>
#include "uuid.h"
#include "encoding.h"
#include "http.h"
#include "log.h"
#include "ArduinoOTA.h"

#define PORT 80

String otaPassword = "";
String deviceKey = "water-supply";

String onRequest(String header, WiFiClient client)
{
    // pinState = pinState == LOW ? HIGH : LOW;

    // digitalWrite(12, pinState);

    return "currently 4"; //+ String(pinState);
}

HttpServer server(PORT, onRequest);

void setup()
{
    Serial.begin(9600);
    Serial.println("start");
    otaPassword = generateUuid();

    Serial.println("ota password: " + otaPassword);
    logData("info", deviceKey + " startup log", {{"application", deviceKey}, {"otaPassword", otaPassword}});
    Serial.println(serverEndpoint());
    server.begin();
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