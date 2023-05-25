#include <Arduino.h>
#include "lib/str.h"
#include "lib/http.h"
#include "lib/log.h"
#include "lib/prop.h"
#include "lib/http_client.h"
#include "ArduinoOTA.h"

int serialPin = 16;

HardwareSerial gpioSerial(0);

String onRequest(HttpRequest *request)
{
    if (str_includes(request->path.c_str(), "baud"))
    {
        gpioSerial.end(false);
        int newBaud = stoi(request->body);
        gpioSerial.begin(newBaud, 134217756U, serialPin);
        return "done";
    }

    return "not implemented";
}

HttpServer server(80, onRequest);
int defaultBaud = 115200;

void sendLine(std::string line)
{
    HttpClientRequest req;
    req.url = "http://192.168.178.34:13579/log";
    req.txtBody(line);
    req.callback = negativeResponseLogger;
    req.send();
}

void setup()
{
    Serial.begin(115200);
    Serial.setDebugOutput(true);
    gpioSerial.begin(defaultBaud, 134217756U, serialPin);
    delay(100);
    Serial.println("socketv2");
    sendLine("init");
    server.begin();
    std::string otaPassword = "7kg8s02n-ixy07d7k-sww9za8x-pdv36fj7"; // generateUuid();
    ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
    ArduinoOTA.setPassword(otaPassword.c_str());
    ArduinoOTA.begin();
    // put your setup code here, to run once:
}

void loop()
{

    if (gpioSerial.available())
    {
        String str = gpioSerial.readString();
        Serial.println(str);
        sendLine(str.c_str());
    }
    server.step();
    ArduinoOTA.handle();
    // put your main code here, to run repeatedly:
}