#include <Arduino.h>
#include <vector>

#include "lib/log.h"
#include <Wire.h>

#include "i2c.h"
#include "shared.h"
#include <INA226_WE.h>
struct VoltageSOC
{
    float voltage; // Voltage in volts
    int soc;       // State of charge in percent
};
// Lookup table for 12V LiFePO4 battery (4S) at rest
const std::vector<VoltageSOC> lifepo4SOC12V = {{13.6, 100}, {13.4, 100}, {13.3, 90}, {13.2, 80}, {13.1, 70}, {13.0, 60},
                                               {12.9, 50},  {12.8, 40},  {12.7, 30}, {12.6, 20}, {12.5, 10}, {12.0, 0}};

class Battery
{
  private:
    const std::vector<VoltageSOC> lifepo4SOC;
    float capacityAh;

  public:
    Battery(const std::vector<VoltageSOC> lifepo4SOC, float capacityAh) : lifepo4SOC(lifepo4SOC), capacityAh(capacityAh)
    {
    }

    float estimateSOC(float voltage)
    {

        for (int i = 0; i < lifepo4SOC.size() - 1; ++i)
        {
            if (voltage >= lifepo4SOC[i + 1].voltage && voltage <= lifepo4SOC[i].voltage)
            {
                float v1 = lifepo4SOC[i].voltage;
                float v2 = lifepo4SOC[i + 1].voltage;
                int soc1 = lifepo4SOC[i].soc;
                int soc2 = lifepo4SOC[i + 1].soc;

                // Linear interpolation
                return soc1 + (voltage - v1) * (soc2 - soc1) / (v2 - v1);
            }
        }

        // Outside the range
        if (voltage >= lifepo4SOC.front().voltage)
            return 100;
        if (voltage <= lifepo4SOC.back().voltage)
            return 0;

        return -1; // Should never reach here
    }

    float estimateRemainingTime(float socPercent, float loadA)
    {
        if (loadA <= 0)
            return -1; // invalid load current

        return (capacityAh * socPercent) / (100.0f * loadA);
    }
};

class INA226Ref
{
  public:
    INA226_WE ina266;
    StatusUpdater *status;
    bool initialized = false;

    float lastVoltage = -1;
    float lastCurrentmA = -1;

    INA226Ref(ThreeWire *wire, int address, StatusUpdater *updater) : status(updater)
    {
        ina266 = INA226_WE(wire, address);
    }

    bool initialize()
    {
        if (!ina266.init())
        {
            logData("ERROR", "INA226 not detected!", {});
            Serial.println("INA226 not detected!");
            return false;
        }
        ina266.setAverage(AVERAGE_4);
        ina266.setMeasureMode(CONTINUOUS);
        ina266.setResistorRange(0.002, 10);
        initialized = true;
        return true;
    }

    void checkForI2cErrors()
    {
        byte errorCode = ina266.getI2cErrorCode();
        if (errorCode)
        {
            Serial.print("I2C error: ");
            Serial.println(errorCode);

            String newStatus = ThreeWire::getErrorDesciption(errorCode);

            if (errorCode)
            {
                Serial.println(newStatus);
                status->updateStatus(newStatus);
                logData("ERROR", "got ic2 error", {{"error", newStatus.c_str()}});
                assert(false);
            }
        }
    }

    int voltage_mV()
    {
        return lastVoltage * 1000;
    }

    void fetchVoltage()
    {
        lastVoltage = ina266.getBusVoltage_V();
        // Serial.print("Bus Voltage battery: ");
        // Serial.print(lastVoltage, 6);
        checkForI2cErrors();
    }

    void fetchCurrent()
    {
        lastCurrentmA = ina266.getCurrent_mA();
        // Serial.print("Bus Current: ");
        // Serial.print(lastCurrentmA, 6);
        // Serial.println(" mA");

        checkForI2cErrors();
    }
};
