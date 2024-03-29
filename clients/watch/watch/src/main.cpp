#include <Arduino.h>
// #include "lib/wi_fi.h"
// #include "lib/log.h"
// #include "lib/uuid.h"
// #include "lib/prop.h"
#include <ArduinoOTA.h>

#define RADIOLIB_DEBUG true
#include <LilyGoLib.h>
#include <LV_Helper.h>
#include <map>
#include "lib/str.h"
#include "lora_config.h"

LoRaWANNode *node = NULL;

std::string wifistr;

uint32_t *secondsSinceEpoch;
uint8_t *fraction;

void WiFiScanDone(WiFiEvent_t event, WiFiEventInfo_t info)
{
  Serial.println("WiFiScanDone");
  int16_t counter = WiFi.scanComplete();

  wifistr = "";

  for (int i = 0; i < counter; ++i)
  {

    std::string ssid = WiFi.SSID(i).c_str();
    wifistr += "wifi_" + ssid + "rssi:" + itos(WiFi.RSSI(i)) + "channel:" + itos(WiFi.channel(i));

    Serial.printf("%2d", i + 1);
    Serial.print(" | ");
    Serial.printf("%-32.32s", WiFi.SSID(i).c_str());
    Serial.print(" | ");
    Serial.printf("%4d", WiFi.RSSI(i));
    Serial.print(" | ");
    Serial.printf("%2d", WiFi.channel(i));
    Serial.print(" | ");
    Serial.println();
  }
  // Keep scan
  WiFi.scanNetworks(true);
}

void drawTime()
{
  long time = *secondsSinceEpoch;
  struct tm info;
  localtime_r(&time, &info);
  watch.drawString((itos(info.tm_year + 1900) + ":" + itos(info.tm_sec)).c_str(), 160, 120);
}

void beginNodeOtaa(int rec_ct = 0)
{

  // issues : https://github.com/Xinyuan-LilyGO/TTGO_TWatch_Library/issues/231
  int state = node->beginOTAA(joinEUI, devEUI, nwkKey, appKey);
  if (state == RADIOLIB_ERR_NONE || state == RADIOLIB_LORAWAN_MODE_OTAA)
  {
    Serial.println(F("success!"));
  }
  else
  {
    Serial.print(F("failed, code "));
    Serial.println(state);

    if ((state == RADIOLIB_ERR_RX_TIMEOUT && rec_ct < 10) || (state == RADIOLIB_ERR_CRC_MISMATCH))
    {
      watch.fillScreen(TFT_ORANGE);
      watch.drawString(("state:" + itos(state) + "-retrying:" + itos(rec_ct)).c_str(), 120, 120);
      beginNodeOtaa(rec_ct + 1);
      return;
    }
    watch.fillScreen(TFT_RED);
    watch.drawString("error", 120, 120);
    while (true)
    {
      Serial.print(F("failed, code "));
      Serial.println(state);
      delay(4000);
    }
  }
}

void setup()
{
  // setCpuFrequencyMhz(160);
  Serial.begin(115200); // Debug only
  delay(500);
  Serial.println("starting");

  watch.begin();
  beginLvglHelper(false);
  delay(4000);

  if (watch.setFrequency(868.0) == RADIOLIB_ERR_INVALID_FREQUENCY)
  {

    while (true)
    {
      Serial.println(F("Selected frequency is invalid for this module!"));
      delay(1000);
    }
  }
  node = new LoRaWANNode(&watch, &EU868);
  // node->setTxPower(16);

  Serial.println(F("created node"));

  Serial.println(F("begin OTAA"));

  beginNodeOtaa();
  // end device id  eui-70b3d57ed00657bb

  int timeState = node->getMacDeviceTimeAns(secondsSinceEpoch, fraction);
  if (timeState == RADIOLIB_ERR_NONE)
  {
    drawTime();
  }
  // watch.fillScreen(TFT_RED);

  // Tips : Select a separate function to see the effect
  // lv_example_colorwheel_1();

  // Serial.println("starting");
  // Serial.println("init wifi");

  // waitForWifi();
  //  Serial.println("got wifi");
  //   std::string otaPassword = generateUuid();
  //    logData("INFO", "startup log", {{"otaPassword", otaPassword}});
  //     ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
  //      ArduinoOTA.setPassword(otaPassword.c_str());
  //       ArduinoOTA.begin();
  //        logData("INFO", "started OTA", {{}});

  // tft.begin(TFT_RED); // initialize

  // tft.fillScreen(TFT_RED);
  // logData("INFO", "begin tft", {{}});

  if ((WiFi.getStatusBits() & WIFI_SCANNING_BIT) != WIFI_SCANNING_BIT)
  {
    Serial.println("scanNetworks");
    WiFi.onEvent(WiFiScanDone, WiFiEvent_t::ARDUINO_EVENT_WIFI_SCAN_DONE);
    WiFi.mode(WIFI_STA);
    WiFi.scanNetworks(true);
  }
}

int count = 0;
void printDownlink(String &strDown)
{
  Serial.println(F("success!"));

  // print data of the packet (if there are any)
  Serial.print(F("[LoRaWAN] Data:\t\t"));
  if (strDown.length() > 0)
  {
    Serial.println(strDown);
  }
  else
  {
    Serial.println(F("<MAC commands only>"));
  }

  // print RSSI (Received Signal Strength Indicator)
  Serial.print(F("[LoRaWAN] RSSI:\t\t"));
  Serial.print(watch.getRSSI());
  Serial.println(F(" dBm"));

  // print SNR (Signal-to-Noise Ratio)
  Serial.print(F("[LoRaWAN] SNR:\t\t"));
  Serial.print(watch.getSNR());
  Serial.println(F(" dB"));

  // print frequency error
  Serial.print(F("[LoRaWAN] Frequency error:\t"));
  Serial.print(watch.getFrequencyError());
  Serial.println(F(" Hz"));
}

void loop()
{
  drawTime();

  Serial.print(F("[LoRaWAN] Sending uplink packet ... "));
  // String strUp = wifistr.c_str();
  String strUp = "Hello World! #" + String(count++);
  int state = node->uplink(strUp, 10);
  if (state == RADIOLIB_ERR_NONE)
  {
    Serial.println(F("success!"));
  }
  else
  {
    Serial.print(F("failed, code "));
    Serial.println(state);
  }

  Serial.print(F("[LoRaWAN] Waiting for downlink ... "));
  String strDown;
  state = node->downlink(strDown);
  if (state == RADIOLIB_ERR_NONE)
  {
    printDownlink(strDown);
  }
  else if (state == RADIOLIB_ERR_RX_TIMEOUT)
  {
    Serial.println(F("timeout!"));
  }
  else
  {
    Serial.print(F("failed, code "));
    Serial.println(state);
  }
  Serial.println("loop");
  // ArduinoOTA.handle();

  // lv_task_handler();
  delay(10000);
}
