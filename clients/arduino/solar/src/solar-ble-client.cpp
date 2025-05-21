
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Arduino.h>
#include "shared.h"

const uint8_t notificationOn[] = {0x1, 0x0};

typedef std::function<void(std::vector<uint8_t> data)> NotifiyCommand;

class R600BleClient
{

public:
  R600BleClient(const char *mac_addr, StatusUpdater *screenR) : screen(screenR), r600Address(BLEAddress(mac_addr)) {};

  void init(NotifiyCommand c1)
  {
    command1 = c1;
    BLEDevice::init("ESP32");

    pClient = BLEDevice::createClient();

    class R600BleClientClientCallback : public BLEClientCallbacks
    {
    private:
      R600BleClient *client;

    public:
      R600BleClientClientCallback(R600BleClient *cli) : client(cli) {}

      void onConnect(BLEClient *pclient) override
      {
      }

      void onDisconnect(BLEClient *pclient) override
      {
        Serial.println("disconnected");
        delay(60000);

        client->shouldConnect = true;
      }
    };
    pClient->setClientCallbacks(new R600BleClientClientCallback(this));
  }

  void step()
  {

    if (shouldConnect)
    {

      init_ble_client();
    }
  }

private:
  bool shouldConnect = true;
  StatusUpdater *screen;
  BLEAddress r600Address;
  BLEUUID serviceAddress = BLEUUID("0000fff0-0000-1000-8000-00805f9b34fb");
  BLEUUID characteristic = BLEUUID("0000fff1-0000-1000-8000-00805f9b34fb");
  BLEClient *pClient;

  NotifiyCommand command1;
  void command3(std::vector<uint8_t> data)
  {
    // TODO
  }

  void init_ble_client()
  {
    Serial.println("connecting ble ...");

    if (pClient->connect(r600Address))
    {
      screen->updateStatus("ble connected");
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

      characeristic->registerForNotify([this](BLERemoteCharacteristic *pBLERemoteCharacteristic,
                                              uint8_t *pData, size_t length, bool isNotify)
                                       {
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
};
