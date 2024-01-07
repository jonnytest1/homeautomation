#include <Arduino.h>
#include "CC1101_ESP_Arduino.h"
#include <EspBitBanger.h>
#include "ArduinoOTA.h"
#include "lib/http.h"
#include "lib/str.h"
#include "lib/prop.h"
#include "lib/log.h"
#include "lib/jsonnode.h"
#include "lib/smarthome.h"
#include "lib/restart.h"
#include <bits/basic_string.h>
#include "read-entry.h"
#include <list>

#define PORT 80

const int SPI_SCK = 18;          // board or mcu specific
const int SPI_MISO = 19;         // board or mcu specific
const int SPI_MOSI = 23;         // board or mcu specific
const int SPI_CS = 5;            // select any pin
const int RADIO_INPUT_PIN = 12;  // select any pin, this is the TX-PIN
const int RADIO_OUTPUT_PIN = 13; // select any pin, this is the RX-PIN

CC1101 cc1101(SPI_SCK, SPI_MISO, SPI_MOSI, SPI_CS, RADIO_INPUT_PIN, RADIO_OUTPUT_PIN);

volatile long last_micros;
volatile long last_millis;

std::list<ReadEntry> entryList;

bool isSending = false;

void radioHandlerOnChange()
{
  if (isSending)
  {
    return;
  }

  int delta_micros = micros() - last_micros;

  bool input = digitalRead(RADIO_OUTPUT_PIN);

  while (entryList.size() > 4000)
  {
    entryList.pop_front();
  }

  ReadEntry entry = ReadEntry(millis(), input, delta_micros);
  entryList.push_back(entry);
  /*
    if (input == 1)
    {
        readBuffer += "\n01 " + String(delta_micros);
    }
    else
    {
        readBuffer += "\n10 " + String(delta_micros);
    }*/

  last_micros = micros();
}

uint8_t bufferEx[] = {
    0b11101110,
    0b10001110,
    0b10001000,
    0b10001110,
    0b11101110,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b11101110,
    0b10001110,
    0b10001110,
    0b10000000};

// 0b11101110, 111=long on 0 = short off
// 0b10001110, 1 = short on 000 = long off
// LSSSLSSSSLLS LSSLSSSSLSLSS
uint8_t bufferSlower[] = {
    0b11101000, // long short
    0b10001000, // short short
    0b11101000, // long short
    0b10001000, // short short
    0b10001110, // short long
    0b11101000, // long short

    0b11101000, // long short
    0b10001110, // short long
    0b10001000, // short short
    0b10001000, // short short
    0b11101000, // long short
    0b11101000, // long short
    0b10000000, // short -
};
uint8_t bufferFaster[] = {
    0b11101000, // long short
    0b10001000, // short short
    0b11101000, // long short

    0b10001000, // short short
    0b10001110, // short long
    0b11101000, // long short

    0b11101000, // long short
    0b10001110, // short long
    0b10001000, // short short

    0b10001000, // short short
    0b11101110, // long long
    0b10001000, // short short
    0b10000000, // short -
};

uint8_t bufferPwr[] = {
    0b11101000, // long short
    0b10001000, // short short
    0b11101000, // long short

    0b10001000, // short short
    0b10001110, // short long
    0b11101000, // long short

    0b11101000, // long short
    0b10001110, // short long
    0b10001000, // short short

    0b10001000, // short short
    0b11101110, // long long
    0b11101000, // long short
    0b10000000, // short -
};
void readSignals()
{
  cc1101.setMHZ(433.92);
  cc1101.setTXPwr(TX_PLUS_10_DBM);
  cc1101.setDataRate(10000);
  cc1101.setModulation(ASK_OOK);
  cc1101.setRx();
}
void sendBits(uint8_t bitBuffer[], int bSize, int baud)
{
  isSending = true;
  EspBitBanger bitBanger;
  // int baud = 2466;

  Serial.println(baud);
  Serial.println(bSize);

  bitBanger.begin(baud, -1, RADIO_INPUT_PIN);

  Serial.println("sending");
  cc1101.setIdle();
  cc1101.setMHZ(433.99);
  cc1101.setTXPwr(TX_PLUS_10_DBM);
  cc1101.setDataRate(10000);
  cc1101.setModulation(ASK_OOK);

  cc1101.setTx();
  for (int i = 0; i < 5; i++)
  {
    delay(10);
    bitBanger.write(bitBuffer, bSize);
  }
  cc1101.setIdle();
  Serial.println("reidle");
  delay(10);

  Serial.println("loop done");
  isSending = false;
  readSignals();
}

void onAction(std::string actionName, SmartHome *sm)
{
  if (actionName == "pwr")
  {
    Serial.println("pwr");
    sendBits(bufferPwr, sizeof(bufferPwr) / sizeof(bufferPwr[0]), 2466);
  }
  else if (actionName == "faster")
  {
    Serial.println("faster");
    sendBits(bufferFaster, sizeof(bufferFaster) / sizeof(bufferFaster[0]), 2466);
    // sm->updateState(JsonFactory::FALSE());
  }
  else if (actionName == "slower")
  {
    Serial.println("slower");
    sendBits(bufferSlower, sizeof(bufferSlower) / sizeof(bufferSlower[0]), 2466);
    // sm->updateState(JsonFactory::FALSE());
  }
}

SmartHome smarthome(onAction);

std::string onRequest(HttpRequest *request)
{
  //

  if (request->path.indexOf("pwr") > -1)
  {
    Serial.println("pwr");
    sendBits(bufferPwr, sizeof(bufferPwr) / sizeof(bufferPwr[0]), 2466);
  }
  else if (request->path.indexOf("minus") > -1)
  {
    Serial.println("minus");
    sendBits(bufferSlower, sizeof(bufferSlower) / sizeof(bufferSlower[0]), 2466);
  }
  else if (request->path.indexOf("faster") > -1)
  {
    Serial.println("faster");
    sendBits(bufferFaster, sizeof(bufferFaster) / sizeof(bufferFaster[0]), 2466);
  }
  else if (request->path.indexOf("custom") > -1)
  {
    Serial.println("custom1");
    Serial.println("json body:");
    Serial.println(request->body.c_str());
    JsonNode jsonBody = parseJson(request->body);
    Serial.println("json parsed");

    Serial.println("keys:");
    Serial.println(jsonBody.objectContent.size());
    for (std::map<std::string, JsonNode>::iterator it = jsonBody.objectContent.begin(); it != jsonBody.objectContent.end(); ++it)
    {
      Serial.println("key:");
      Serial.println(it->first.c_str());
    }
    int baud = jsonBody.objectContent.at("baud").numberValue;

    std::string byteString = jsonBody.objectContent.at("signal").textValue.c_str();

    Serial.println("keys extracted");
    char longHigh[] = "1110";
    char shortHigh[] = "1000";

    byteString = str_replace_all(byteString, "S", shortHigh);
    byteString = str_replace_all(byteString, "L", longHigh);

    Serial.println("string conversion");
    double size = byteString.length();
    int bufferSize = ceil(size / 8);

    uint8_t customBuffer[bufferSize];

    Serial.println("new size");
    Serial.println(bufferSize);
    for (int i = 0; i < bufferSize; i++)
    {
      std::string substr = sub_string(byteString, i * 8, (i * 8) + 8);
      int num = strtol(substr.c_str(), nullptr, 2);

      if (substr.length() == 4)
      {
        num = num << 4;
      }

      Serial.println(num);
      customBuffer[i] = num;
    }
    Serial.println("buffer convert");
    // TODO
    sendBits(customBuffer, bufferSize / sizeof(customBuffer[0]), baud);
  }
  else if (request->path.indexOf("read") > -1)
  {

    std::string resp = "[";
    bool first = true;
    Serial.println(entryList.size());
    // std::string origin = request->headers.at("origin").c_str();
    request->responseHeaders.insert(std::pair<std::string, std::string>("Access-Control-Allow-Origin", "localhost"));
    for (std::list<ReadEntry>::iterator it = entryList.begin(); it != entryList.end(); ++it)
    {
      if (!first)
      {
        resp += ",";
      }
      first = false;
      resp += "{\"toHight\":";
      resp += it->state;
      resp += ",\"duration\":";
      resp += it->duration;
      resp += ",\"ts\":";
      resp += it->millis;
      resp += "}";
    }
    request->responseStatus = 200;
    resp += "]";
    return resp;
  }

  return "done";
}

JsonNode getReceiver()
{

  JsonNode actions = JsonFactory::list( //
      {                                 //
       JsonFactory::obj(                //
           {
               //
               {"name", JsonFactory::str("pwr")}}),
       JsonFactory::obj( //
           {
               //
               {"name", JsonFactory::str("faster")},
           }),
       JsonFactory::obj( //
           {
               //
               {"name", JsonFactory::str("slower")},
           })});
  return JsonFactory::obj({
      {"name", JsonFactory::str("radio")},
      {"state", JsonFactory::str("boolean")},
      {"description", JsonFactory::str("radio emitter")},
      {"actions", actions} //
  });
}

void setup()
{
  Serial.begin(115200);
  Serial.println("start");

  smarthome.fallbackRequestHandler = onRequest;
  smarthome.getReceiverConfig = getReceiver;

  smarthome.init();
  Serial.println("server started");

  std::string otaPassword = "fskz570s-36inwky3-m8y4kg28-wh3xzzaf"; // generateUuid();

  ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
  ArduinoOTA.setPassword(otaPassword.c_str());
  ArduinoOTA.begin();
  Serial.println("ArduinoOTA started");
  cc1101.init();
  Serial.println("init cc1101 ");
  Serial.printf("CC1101: 0x%02x, version: 0x%02x\n", cc1101.getPartnum(), cc1101.getVersion());
  Serial.println("firmware vs 13");
  readSignals();

  smarthome.next([]()
                 { logRestartReason(); });
  smarthome.next([otaPassword]()
                 { logData("INFO", "startup log", {{"otaPassword", otaPassword}}); });

  smarthome.next([]()
                 { attachInterrupt(RADIO_OUTPUT_PIN, radioHandlerOnChange, CHANGE); });
}

void loop()
{
  ArduinoOTA.handle();
  smarthome.step();

  while (entryList.size() > 0 && entryList.front().millis < (millis() - (1000 * 3)))
  {
    entryList.pop_front();
  }

  last_millis = millis();
}