
#include "bitmask.h"
#include "shared.h"
#include <Arduino.h>
#include <BLEDevice.h>

const uint8_t notificationOn[] = {0x1, 0x0};

/**
 * @brief
 * works with
 *  - R600
 *  - R1500
 */
class AllpowersBleData
{
  private:
    int bitValue(uint8_t bitmask, uint8_t index)
    {

        return (bitmask >> (index - 1)) & 1;
    }

  public:
    AllpowersBleData(std::vector<uint8_t> data)
    {
        statusBitMask = data[7];
        currentChargePercent = data[8];
        inPower = 256 * data[9] + data[10];
        outPower = 256 * data[11] + data[12];
        remainingMins = 256 * data[13] + data[14];
        dcOpen = bitValue(statusBitMask, 1);
        acOpen = bitValue(statusBitMask, 2);
        is60Hz = bitValue(statusBitMask, 3);
        beepOpen = bitValue(statusBitMask, 4);
        ledOpen = bitValue(statusBitMask, 5);
        screenOpen = bitValue(statusBitMask, 6);
        voiceOpen = bitValue(statusBitMask, 7);
    };
    uint8_t statusBitMask;
    int inPower;
    int remainingMins;
    int currentChargePercent;
    int outPower;

    int dcOpen;
    int acOpen;
    int is60Hz;
    int beepOpen;
    int ledOpen;
    int screenOpen;
    int voiceOpen;
};

typedef std::function<void(AllpowersBleData *data)> NotifiyCommand;
class AllpowersBleClient
{

  public:
    AllpowersBleClient(const char *mac_addr, StatusUpdater *screenR)
        : screen(screenR), r600Address(BLEAddress(mac_addr)) {};

    void init(const NotifiyCommand &c1)
    {
        command1 = std::move(c1);

        BLEDevice::init("ESP32");

        pClient = BLEDevice::createClient();

        class AllpowersBleClientClientCallback : public BLEClientCallbacks
        {
          private:
            AllpowersBleClient *client;

          public:
            AllpowersBleClientClientCallback(AllpowersBleClient *cli) : client(cli)
            {
            }

            void onConnect(BLEClient *pclient) override
            {
            }

            void onDisconnect(BLEClient *pclient) override
            {
                ESP_LOGE(L_TAG, "disconnected");
                delay(60000);

                client->shouldConnect = true;
            }
        };
        pClient->setClientCallbacks(new AllpowersBleClientClientCallback(this));
        ESP_LOGI(L_TAG, "initialized BLE");
        initialized = true;
    }

    void step()
    {
        if (!initialized)
        {
            return;
        }
        if (shouldConnect || millis() - lastNotify > (1000 * 60 * 2))
        {
            xTaskCreatePinnedToCore(connectTaskEntry, "bleConnect", 8192, this, 1, NULL, 1);
        }
    }
    /**
     * there migiht be some issues with this part - not sure
     */
    void enablePower()
    {
        sendBits.setBit(dcIndex);
        sendBits.setBit(acIndex);

        sendData(sendBits.get());
    }

  private:
    bool shouldConnect = true;
    bool initialized = false;
    StatusUpdater *screen;
    BLEAddress r600Address;
    BLEUUID serviceAddress = BLEUUID("0000fff0-0000-1000-8000-00805f9b34fb");
    BLEUUID characteristic = BLEUUID("0000fff1-0000-1000-8000-00805f9b34fb");
    BLEClient *pClient;
    BLERemoteCharacteristic *remoteCharaceristic;

    NotifiyCommand command1 = nullptr;
    unsigned long lastNotify = -1;

    uint8_t mainSettings = 0x01;
    uint8_t dcIndex = 0;
    uint8_t acIndex = 1;

    Bitmask sendBits;

    static void connectTaskEntry(void *pvParams)
    {
        AllpowersBleClient *self = static_cast<AllpowersBleClient *>(pvParams);
        self->init_ble_client();
        vTaskDelete(NULL);
    }

    void command3(std::vector<uint8_t> data)
    {
        // TODO
    }

    void init_ble_client()
    {
        screen->updateStatus("connecting ble ..");

        if (pClient->connect(r600Address))
        {
            screen->updateStatus("ble connected");
            shouldConnect = false;
            ESP_LOGI(L_TAG, " Connected to BLE server");

            BLERemoteService *pRemoteService = pClient->getService(serviceAddress);
            if (pRemoteService == nullptr)
            {
                ESP_LOGE(L_TAG, " Failed to find our service UUID");
                return;
            }
            ESP_LOGI(L_TAG, "got service");
            remoteCharaceristic = pRemoteService->getCharacteristic(characteristic);

            remoteCharaceristic->registerForNotify([this](BLERemoteCharacteristic *pBLERemoteCharacteristic,
                                                          uint8_t *pData, size_t length, bool isNotify) {
                lastNotify = millis();
                std::vector<uint8_t> arr(pData, pData + length);

                updateCharacteristic(arr);
            });

            ESP_LOGI(L_TAG, "notify registered");
        }
        else
        {
            ESP_LOGE(L_TAG, "ble connect failed");
        }
    }

    std::vector<uint8_t> withChecksum(std::vector<uint8_t> data)
    {
        uint8_t checksum = 0;
        for (uint8_t val : data)
        {
            checksum ^= val;
        }
        std::vector<uint8_t> newData = data;
        newData.push_back(checksum);
        return newData;
    }

    void sendData(uint8_t state_mask)
    {

        std::vector<uint8_t> command = withChecksum({0xa5, 0x65, 0x0, 0xb1, 0x1, mainSettings, 0x0, state_mask});

        remoteCharaceristic->writeValue(command.data(), command.size(), true);
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
            auto parsedData = new AllpowersBleData(data);
            command1(parsedData);
        }
        else if (command == 3)
        {
            command3(data);
        }
    }
};
