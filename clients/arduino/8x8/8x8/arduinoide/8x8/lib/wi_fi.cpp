#include "wi_fi.h"
#include <WiFi.h>
#include "arduinoref.h"
#include "prop.h"
#include "str.h"

std::string localIp = "";

WifiCallback wifi_cb;

WifiCallback wifi_cb_ref()
{
  if (wifi_cb.wifi_timeout == nullptr)
  {
    wifi_cb.wifi_timeout = []() {};
  }
  return wifi_cb;
}

void waitForWifi()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    return;
  }

  char hostname[32];
  strcpy(hostname, "c-esp32-");
  strcat(hostname, getDeviceKey().c_str());

  WiFi.setHostname(hostname);
  Serial.println(String("hostame : ") + hostname);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  Serial.println("setting hostname ... ");

  WiFi.begin(getWlanSSID().c_str(), getWlanPWD().c_str());
  int t = 0;
  while (WiFi.status() != WL_CONNECTED)
  {
    t++;
    delay(100);
    Serial.println("connecting ... " + WiFi.status());
    if (t > 50)
    {
      wifi_cb_ref().wifi_timeout();
      delay(400);
      Serial.println("ERROR Connecting wifi > 50 took more than 5000 millis");
      WiFi.begin(getWlanSSID().c_str(), getWlanPWD().c_str());
      t = 0;
    }
  }
  Serial.println("WiFi connected.");
  String ip = WiFi.localIP().toString();
  localIp = ip.c_str();
  Serial.println(ip);
}

std::string getDeviceIp()
{
  return localIp;
}