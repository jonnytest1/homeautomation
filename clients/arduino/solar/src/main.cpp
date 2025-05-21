#define CORE_DEBUG_LEVEL ARDUHAL_LOG_LEVEL_VERBOSE
#define CONFIG_COMPILER_CXX_EXCEPTIONS
// #define WIFI_Kit_32

#include <Arduino.h>
#include "lib/smarthome.h"
#include "lib/wi_fi.h"
#include "lib/prop.h"
#include "lib/log.h"
#include "lib/str.h"
#include "lib/restart.h"
#include "ArduinoOTA.h"
#include <exception>
#include "esp_debug_helpers.h"
#include "lib/uuid.h"
#include "creds.h"
#include "solar-ble-client.cpp"
#include "timesetup.cpp"
#include "screen.cpp"
#include "relayboard.h"

// #include "test_stuff.h"

void onAction(std::string actionName, SmartHome *sm)
{
}

SmartHome smarthome(onAction);

Screen screen;

R600BleClient r600BleClient(mac_address, &screen);

long lastUpdate = 0;
long inPower0Since = 0;
long inPower0LastReset = 0;

RelayBoard16 board16 = RelayBoard16(0x20);

RelayBoardIndex *landline = board16.forIndex(1);

int resetFrequency = 1000 * 60 * 5;
int min0ForGh = 1000 * 60 * 60 * 6;

// pins https://excalidraw/_https://excalidraw/?file=power&element=72tbTR_-LwVMT9EohzrCS
RelayBoardIndex *solarLine = board16.forIndex(2);

int minLandlineOfftime = 1000 * 60;
int bitValue(uint8_t bitmask, uint8_t index)
{

  return (bitmask >> (index - 1)) & 1;
}

int remainingMinutes = -1;
long remainingMinutesSince = 0;

void reset()
{

  Serial.println("resetting on pin 16");
  screen.showStatus("resetting ...");
  solarLine->on();
  delay(1000);
  solarLine->off();

  smarthome.next([]()
                 { logData("WARN", "reset solar", {}); });
}

String checkReset(int inPower)
{

  long now = millis();
  long lastOffAgo = (now - landline->lastOffTimestamp);

  if (landline->currentState || lastOffAgo < minLandlineOfftime)
  {
    return String("landline ") + (floor(lastOffAgo / 1000));
  }

  if (inPower == 0)
  {

    if (inPower0Since == 0)
    {
      inPower0Since = now;
    }
    long timeSincePower0 = now - inPower0Since;
    if (timeSincePower0 < min0ForGh)
    {
      return String("min ") + itos((min0ForGh - timeSincePower0) / (1000 * 60)).c_str();
    }

    struct tm timeinfo;
    if (!getLocalTime(&timeinfo))
    {
      Serial.println("Failed to obtain time 1");
      return "err";
    }
    if (timeinfo.tm_hour > 5 && timeinfo.tm_hour < 16)
    {
      Serial.println("got time fit");

      int timeSinceLastReset = now - inPower0LastReset;

      if (timeSinceLastReset > resetFrequency)
      {
        inPower0LastReset = now;
        reset();
        return "true";
      }

      return String("frq ") + itos((resetFrequency - timeSinceLastReset) / (1000 * 60)).c_str() + " /5";
    }
    return "t";
  }
  else
  {
    inPower0Since = 0;
    return "-";
  }
}

void command1(std::vector<uint8_t> data)
{

  smarthome.next([data]()
                 {
    uint8_t statusBitMask = data[7];
    Serial.println("sending event cmd1");

    int inPower = 256 * data[9] + data[10];
    String updateText = itos(inPower).c_str() + String(" in");
    

    Serial.println(updateText);
    int remainingMins = 256 * data[13] + data[14];
    if(remainingMins!=remainingMinutes){
      remainingMinutes = remainingMins;
      remainingMinutesSince=millis();
    }

    if(remainingMinutesSince!=0){
      int millisSince = millis() - remainingMinutesSince;

      remainingMins = remainingMinutes - floor(millisSince/(1000*60));
    }


    screen.statusLine2 = itos(remainingMins).c_str() + String(" rem");

    updateText += "  " + checkReset(inPower);
    screen.updateStatus(updateText);

    if ((millis() - lastUpdate) < 30000)
    {
      return;
    }
    lastUpdate = millis();

    int currentChargePercent = data[8];

    if(currentChargePercent<15){
      landline->on();
    }else if(currentChargePercent>30){
      landline->off();
    }

    smarthome.triggerSenderEvent("command1", JsonFactory::obj({{"powerAmount", JsonFactory::num(currentChargePercent)},
                                                               {"inPower", JsonFactory::num(inPower)},
                                                               {"outPower", JsonFactory::num(256 * data[11] + data[12])},
                                                               {"remainingMinutes", JsonFactory::num(remainingMins)},
                                                               {"dcOpen", JsonFactory::num(bitValue(statusBitMask, 1))},
                                                               {"acOpen", JsonFactory::num(bitValue(statusBitMask, 2))},
                                                               {"is60Hz", JsonFactory::num(bitValue(statusBitMask, 3))},
                                                               {"beepOpen", JsonFactory::num(bitValue(statusBitMask, 4))},
                                                               {"ledOpen", JsonFactory::num(bitValue(statusBitMask, 5))},
                                                               {"screenOpen", JsonFactory::num(bitValue(statusBitMask, 6))},
                                                               {"voiceOpen", JsonFactory::num(bitValue(statusBitMask, 7))},
                                                               {"landlineState", JsonFactory::num(landline->currentState ? 100 : 0)},
                                                               {"inPower0Since", JsonFactory::num(inPower0Since)}})); });
}

JsonNode getSenderConfig()
{

  JsonNode cmd1Schema = JsonFactory::obj({
      {"type", JsonFactory::str("object")},
  });
  JsonNode cmd2Schema = JsonFactory::obj({
      {"type", JsonFactory::str("object")},
  });
  JsonNode events = JsonFactory::list( //
      {
          //
          JsonFactory::obj( //
              {
                  //
                  {"name", JsonFactory::str("command1")},
                  {"schema", cmd1Schema},

              }),
          JsonFactory::obj( //
              {
                  //
                  {"name", JsonFactory::str("command2")},
                  {"schema", cmd2Schema},
              })});

  return JsonFactory::obj({
      {"name", JsonFactory::str("solar battery")},
      {"description", JsonFactory::str("monitors and controls solar battery")},
      {"events", events},
  });
}

void setup()
{

  // v x x x x x v
  screen.VextON();
  screen.init();

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("start");
  delay(500);
  waitForWifi();

  initTime();
  printLocalTime();
  screen.showStatus("got wifi");

  ArduinoOTA.onStart([]()
                     { screen.showStatus("OTA flashing ..."); });

  ArduinoOTA.onProgress([](int progress, int total)
                        {
      
      String prog = itos((progress / (total / 100))).c_str();
      screen.showStatus("OTA flashing ..." + prog); });

  smarthome.getSenderConfig = getSenderConfig;
  smarthome.init();
  smarthome.ota();
  screen.updateStatus("smarthome init");
  screen.printScreen();

  Wire.begin(48, 47);

  solarLine->_off();
  landline->_off();
  reset();
  landline->onchange = [](boolean newState)
  {
    Serial.println("landline change");
    std::__cxx11::string message = newState ? "landline on" : "landline off";

    smarthome.next([message]() { //
      logData("WARN", message, {{"inPower0Since", itos(inPower0Since)}, {"millis", itos(millis())}});
    });
  };

  r600BleClient.init(command1);

  smarthome.next([]()
                 { logRestartReason(); });
}

void loop()
{
  smarthome.step();

  r600BleClient.step();

  screen.printScreen();
}