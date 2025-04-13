#define CORE_DEBUG_LEVEL ARDUHAL_LOG_LEVEL_VERBOSE
#define CONFIG_COMPILER_CXX_EXCEPTIONS
// #define WIFI_Kit_32

#include "heltec.h"
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
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "creds.h"

SSD1306Wire display(0x3c, SDA_OLED, SCL_OLED, RST_OLED);

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

// #include "test_stuff.h"

void onAction(std::string actionName, SmartHome *sm)
{
}

String statusLine = "";
int statusWritten = millis();

void updateStatus(String newStatus)
{
  statusWritten = millis();
  statusLine = newStatus;
}

void printScreen()
{
  display.clear();

  String lastUpdate = "since: ";
  lastUpdate += itos(millis() - statusWritten).c_str();
  display.drawString(0, 0, lastUpdate);
  display.drawString(0, 32 - 16 / 2, statusLine);
  display.display();
}

SmartHome smarthome(onAction);
const uint8_t notificationOn[] = {0x1, 0x0};
BLEAddress r600Address = BLEAddress(mac_address);
BLEUUID serviceAddress = BLEUUID("0000fff0-0000-1000-8000-00805f9b34fb");
BLEUUID characteristic = BLEUUID("0000fff1-0000-1000-8000-00805f9b34fb");
BLEClient *pClient;
long lastUpdate = 0;

int bitValue(uint8_t bitmask, uint8_t index)
{

  return (bitmask >> (index - 1)) & 1;
}

void command1(std::vector<uint8_t> data)
{

  smarthome.next([data]()
                 {
    uint8_t statusBitMask = data[7];
    Serial.println("sending event cmd1");

    String updateText = itos(256 * data[9] + data[10]).c_str() + String(" in");
    Serial.println(updateText);

    updateStatus(updateText);

    if((millis()-lastUpdate)<10000){
      return;
    }
    lastUpdate = millis();

    smarthome.triggerSenderEvent("command1", JsonFactory::obj({
                                                {"powerAmount", JsonFactory::num(data[8])},
                                                {"inPower", JsonFactory::num(256 * data[9] + data[10])},
                                                {"outPower", JsonFactory::num(256 * data[11] + data[12])},
                                                {"remainingMinutes", JsonFactory::num(256 * data[13] + data[14])},
                                                {"dcOpen", JsonFactory::num(bitValue(statusBitMask, 1))},
                                                {"acOpen", JsonFactory::num(bitValue(statusBitMask, 2))},
                                                {"is60Hz", JsonFactory::num(bitValue(statusBitMask, 3))},
                                                {"beepOpen", JsonFactory::num(bitValue(statusBitMask, 4))},
                                                {"ledOpen", JsonFactory::num(bitValue(statusBitMask, 5))},
                                                {"screenOpen", JsonFactory::num(bitValue(statusBitMask, 6))},
                                                {"voiceOpen", JsonFactory::num(bitValue(statusBitMask, 7))},
                                            })); });
}
void command3(std::vector<uint8_t> data)
{
  // TODO
}
void updateCharacteristic(std::vector<uint8_t> data)
{
  uint8_t static1 = data[0];
  uint8_t static2 = data[1];

  if (static1 != 165 || static2 != 101)
  {
    return;
  }
  uint8_t length = data[5];
  if (8 + length != data.size())
  {
    return;
  }
  uint8_t command = data[6];

  if (command == 1)
  {
    command1(data);
  }
  else if (command == 3)
  {
    command3(data);
  }
}
bool shouldConnect = true;

class MyClientCallback : public BLEClientCallbacks
{
  void onConnect(BLEClient *pclient) override
  {
  }

  void onDisconnect(BLEClient *pclient) override
  {
    Serial.println("disconnected");
    delay(60000);

    shouldConnect = true;
  }
};

void init_ble_client()
{
  Serial.println("connecting ble ...");

  if (pClient->connect(r600Address))
  {
    updateStatus("ble connected");
    shouldConnect = false;

    Serial.println(" - Connected to server");

    BLERemoteService *pRemoteService = pClient->getService(serviceAddress);
    if (pRemoteService == nullptr)
    {
      Serial.print("Failed to find our service UUID: ");
      return;
    }
    Serial.println("got service");
    BLERemoteCharacteristic *characeristic = pRemoteService->getCharacteristic(characteristic);

    characeristic->registerForNotify([](BLERemoteCharacteristic *pBLERemoteCharacteristic,
                                        uint8_t *pData, size_t length, bool isNotify)
                                     {
                                       Serial.println("notify");
                                       std::vector<uint8_t> arr(pData, pData + length);

                                       updateCharacteristic(arr);

                                       // char* data=(char*)pData;

                                       // pCharacteristic->setValue(data);
                                       // pCharacteristic->notify();
                                     });
    // probably unneccesary
    // characeristic->getDescriptor(BLEUUID((uint16_t)0x2902))->writeValue((uint8_t *)notificationOn, 2, true);

    Serial.println("notify registered");
  }
  else
  {

    Serial.println("ble connect failed");
  }
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
  VextON();

  display.init();
  display.setFont(ArialMT_Plain_16);
  display.clear();
  display.screenRotate(ANGLE_0_DEGREE);
  display.clear();

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("start");
  delay(500);
  waitForWifi();

  display.drawString(0, 32 - 16 / 2, "got wifi");
  display.display();
  logRestartReason();

  ArduinoOTA.onStart([]()
                     {
      display.clear();
      display.drawString(0, 0, "OTA flashing ...");
      display.display(); });

  smarthome.getSenderConfig = getSenderConfig;
  smarthome.init();
  smarthome.ota();
  updateStatus("smarthome init");
  printScreen();

  BLEDevice::init("ESP32");

  pClient = BLEDevice::createClient();
  pClient->setClientCallbacks(new MyClientCallback());
}

void loop()
{
  smarthome.step();

  if (shouldConnect)
  {

    init_ble_client();
  }
  printScreen();
}