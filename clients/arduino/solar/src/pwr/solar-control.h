#pragma once
#include "lib/log.h"
#include "relay/relayboard-index.h"
#include <Arduino.h>
#include <vector>

#include "lib/smarthome.h"
#include "shared.h"
#include <string>

struct BatteryChargingPorts
{
    RelayBoardIndex *vcc;
    RelayBoardIndex *ground;
};

/**
 * SolarToPowerStation and  PowerStationToBattery can exist at the same time
 *
 * BatteryToPowerStation and SolarToPowerStation can not
 *
 */
class SolarControl
{

  private:
    /**
     * connected to default on with inverted
     */
    RelayBoardIndex *solarLine;
    /**
     * connected to default off
     */
    RelayBoardIndex *landLine;
    /**
     * connected to default off
     */
    std::vector<BatteryChargingPorts> batteryPorts;
    SmartHome *smarthome;
    StatusUpdater *updater;

    bool isSolarCharging = false;

    unsigned long powerStationToBatteryChangeMillis = 0;
    bool powerStationToBatteryEnabled = false;
    unsigned long powerStationToBatteryIndex = 0;
    BatteryChargingPorts *currentlyEnabledBatteryPort = nullptr;

  public:
    SolarControl(std::vector<BatteryChargingPorts> batteryPorts, RelayBoardIndex *solarLine, RelayBoardIndex *landLine,
                 SmartHome *smarthome, StatusUpdater *updater)
        : solarLine(solarLine), landLine(landLine), batteryPorts(batteryPorts), smarthome(smarthome), updater(updater)
    {
    }

    void resetSolar()
    {

        disableBatteryToPowerStation();

        Serial.println("resetting solar");
        updater->updateStatus("resetting ...");
        solarLine->off();
        delay(1000);
        solarLine->on();

        smarthome->next([]() { logData("WARN", "reset solar", {}); });
    }

    void updateChargeMode(int chargePercent)
    {
        ESP_LOGI(L_TAG, "charge mode with %d", chargePercent);
        /**
         *
         *
         * pwr -> battery
         * 95 %
         * 80 %     -  pwr -> battery
         *
         *
         * 30%      - battery -> pwr
         *          - landline -> pwr
         * 20%
         * battery -> pwr
         *
         * 10%
         * landline -> pwr
         *
         */

        if (chargePercent > 95)
        {
            powerStationToBattery();
        }
        else if (chargePercent < 80)
        {
            disablePowerStationToBattery();
        }
        updatePwrSTationToBatteryPorts();

        if (chargePercent < 20)
        {
            batteryToPowerStation();
            if (chargePercent < 10)
            {
                landLine->on();
            }
        }
        else if (chargePercent > 30)
        {
            disableBatteryToPowerStation();
            landLine->off();
            assert(!landLine->failedUpdate);
        }
    }

    void solarToPowerStation()
    {
        disableBatteryToPowerStation();
    }

    void disablePowerStationToBattery()
    {
        if (powerStationToBatteryEnabled)
        {
            for (auto port : batteryPorts)
            {
                port.ground->off();
                assert(!port.ground->failedUpdate);
                port.vcc->off();
                assert(!port.vcc->failedUpdate);
            }
            powerStationToBatteryEnabled = false;
            delay(1000);
        }
    }

    void powerStationToBattery()
    {
        ESP_LOGW(L_TAG, "powerStationToBattery");
        if (powerStationToBatteryEnabled)
        {
            return;
        }
        disableBatteryToPowerStation();
        int startIndex = random(0, batteryPorts.size());
        powerStationToBatteryEnabled = true;
        powerStationToBatteryIndex = startIndex;
        powerStationToBatteryChangeMillis = millis();

        setPowerStationToBatteryPort();
    }

    void updatePwrSTationToBatteryPorts()
    {
        if (powerStationToBatteryEnabled)
        {
            if (powerStationToBatteryChangeMillis + (1000 * 60 * 4) < millis())
            {
                powerStationToBatteryIndex = (powerStationToBatteryIndex + 1) % batteryPorts.size();
                setPowerStationToBatteryPort();
                powerStationToBatteryChangeMillis = millis();
            }
        }
    }

    void setPowerStationToBatteryPort()
    {
        BatteryChargingPorts &port = batteryPorts.at(powerStationToBatteryIndex);

        if (currentlyEnabledBatteryPort != nullptr)
        {
            currentlyEnabledBatteryPort->ground->off();
            currentlyEnabledBatteryPort->vcc->off();
            delay(2000);
        }
        currentlyEnabledBatteryPort = &port;

        port.vcc->on();
        port.ground->on();
    }

    void disableBatteryToPowerStation()
    {
        ESP_LOGW(L_TAG, "disableBatteryToPowerStation");
        // disable charging
        delay(2000);
        solarLine->on();
    }

    void batteryToPowerStation()
    {
        ESP_LOGW(L_TAG, "batteryToPowerStation");
        disablePowerStationToBattery();
        if (isSolarCharging)
        {
            disableBatteryToPowerStation();
            return;
        }

        solarLine->off();
        delay(2000);
        // enable charging

        // needs 2 ports disable both while pwr -> bat
    }
};