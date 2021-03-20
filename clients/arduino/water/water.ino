#include <iostream>
#include <sstream>
#include <Arduino.h>
#include <map>
#include "creds.h"
#include <chttp.h>

using namespace std::__cxx11;
#define VOLTAGE_PIN 35

String deviceKey = "water";

CHTTP chttp = CHTTP(wlanssid, wlanpassword);

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
}

void registerSender()
{
    chttp.request("https://192.168.178.54/nodets/rest/sender",
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
    chttp.request("https://192.168.178.54/nodets/rest/sender/trigger",
                  {{"deviceKey", deviceKey},
                   {"message", "water"}},
                  triggerHandler, false);
}

void triggerHandler(int code, String data)
{
    if (code != 200 && code != 409)
    {
        Serial.println(data);
        chttp.request("https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php", {{"application", deviceKey}, {"Severity", "ERROR"}, {"message", "error in request"}, {"code", String(code)}, {"error", data}}, NULL, true);
    }
}

void loop()
{
    if (!checkWater())
    {
        Serial.println("oing to sleep");
        esp_sleep_enable_ext0_wakeup(GPIO_NUM_34, 1);
        esp_deep_sleep_start();
    }
}

boolean checkWater()
{
    int powerLevel = analogRead(34);
    return powerLevel > 0;
}
