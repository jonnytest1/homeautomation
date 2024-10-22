#include <Arduino.h>
#include "heltec.h"
#include <ArduinoOTA.h>
#include "lib/prop.h"
#include "lib/uuid.h"
#include "lib/wi_fi.h"
#include "lib/log.h"
#include <IRremote.h>
const int IR_RECEIVER_PIN = 46;
const int IR_SENDER_PIN = -1;

// IRrecv irrecv(IR_RECEIVER_PIN);

SSD1306Wire display(0x3c, SDA_OLED, SCL_OLED, RST_OLED);

IRrecv irrecv(IR_RECEIVER_PIN);

void on_ir_change()
{
  Serial.println("ir changed");
}

void VextON(void)
{
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW);
}

void VextOFF(void) // Vext default OFF
{
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, HIGH);
}

void setup()
{
  VextON();

  Serial.begin(115200);

  display.init();
  display.setFont(ArialMT_Plain_16);

  Serial.println("waiting for wifi");
  waitForWifi();
  irrecv.enableIRIn();

  display.drawString(0, 32 - 16 / 2, "got wifi");
  display.display();

  Serial.println("setup ota");
  std::string otaPassword = generateUuid();
  ArduinoOTA.onError([](ota_error_t e)
                     {
      display.clear();
      display.drawString(0, 0, "OTA failed ...");
      display.display(); });
  ArduinoOTA.onStart([]()
                     {
      display.clear();
      display.drawString(0, 0, "OTA flashing ...");
      display.display(); });
  ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
  ArduinoOTA.setPassword(otaPassword.c_str());
  ArduinoOTA.begin();

  Serial.println("lof pwd");
  logData("INFO", "startup log", {{"otaPassword", otaPassword}});

  Serial.println("attach ir");
  // attachInterrupt(IR_SENDER_PIN, on_ir_change, CHANGE);
  // attachInterrupt(IR_SENDER_PIN, on_ir_change, CHANGE);
}
static uint8_t command = 0;
void loop()
{
  ArduinoOTA.handle();

  if (irrecv.decode())
  {
    Serial.println("got command");
    Serial.println(irrecv.results.value, HEX);

    for (uint16_t *p = irrecv.results.rawbuf; *p; ++p)
    {
      printf("%d,", *p);
    }
    Serial.println("\ndone");
    irrecv.resume();
  }
}