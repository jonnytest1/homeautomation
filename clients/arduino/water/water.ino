#include <HTTPClient.h>
#include <iostream>
#include <sstream>
#include <Arduino.h>
#include <WiFi.h>
#include <map>
#include "creds.h"

using namespace std::__cxx11;

#define VOLTAGE_PIN 35

String deviceKey = "water";

void setup()
{
    Serial.begin(115200);
    pinMode(VOLTAGE_PIN, INPUT);
    switch (esp_sleep_get_wakeup_cause())
    {
    case ESP_SLEEP_WAKEUP_EXT0:
        Serial.println("Touch detected on GPIO 16");
        onWater();
        break;
    case ESP_SLEEP_WAKEUP_EXT1:
        Serial.println("Wakeup caused by external signal using RTC_CNTL");
        break;

    default:
        delay(100); //Take some time to open up the Serial Monitor
        Serial.println("Wakeup not by touchpad");
        registerSender();
        break;
    }
    int GPIO_reason = esp_sleep_get_ext1_wakeup_status();
    Serial.print("GPIO that triggered the wake up: GPIO ");
    Serial.println((log(GPIO_reason)) / log(2), 0);

    Serial.println("oing to sleep");
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_34, 1);
    esp_deep_sleep_start();
}

void registerSender()
{
    request("https://192.168.178.54/nodets/rest/sender",
            {
                {
                    "deviceKey",
                    deviceKey.c_str(),
                },
            },
            triggerHandler, false);
}

void longPress()
{
}

void onWater()
{
    Serial.println("water");
    request("https://192.168.178.54/nodets/rest/sender/trigger", {{"deviceKey", deviceKey}, {"message", "water"}}, triggerHandler, false);
}

void triggerHandler(int code, String data)
{
    if (code != HTTP_CODE_OK && code != 409)
    {
        Serial.println(data);
        request("https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php", {{"application", deviceKey}, {"Severity", "ERROR"}, {"message", "error in request"}, {"code", String(code)}, {"error", data}}, NULL, true);
    }
}

void request(const String url, const std::map<String, String> data, void (*callback)(int httpCode, String response), boolean b64)
{
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
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
void loop()
{
    /*onBell();
    delay(2000);*/
}

String json(const std::map<String, String> content)
{
    String out = "{";
    std::map<String, String>::const_iterator it = content.begin();
    bool separator = false;
    while (it != content.end())
    {
        if (separator)
        {
            out = out + ",";
        }
        else
        {
            separator = true;
        }
        out = out + "\"" + it->first + "\":\"" + it->second + "\" \n ";
        it++;
    }
    return out + "}";
}

void println(String data)
{
    Serial.println(data.c_str());
}

String base64_encode(const String &in)
{

    string out;

    int val = 0, valb = -6;
    for (char c : in)
    {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0)
        {
            out.push_back("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6)
        out.push_back("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[((val << 8) >> (valb + 8)) & 0x3F]);
    while (out.size() % 4)
        out.push_back('=');
    return out.c_str();
}
