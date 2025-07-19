#ifndef i2CThree
#define i2CThree

#include "Wire.h"
#include <Arduino.h>

using ErrorHandler = std::function<void(String error, int attempts)>;

class ThreeWire : public TwoWire
{
  public:
    ErrorHandler onerror = nullptr;

    ThreeWire(int bus) : TwoWire(bus)
    {
    }

    static void listI2c(ThreeWire I2C_2)
    {

        I2C_2.begin(48, 47);
        ESP_LOGI(L_TAG, "I2C Scanner");

        byte error, address;
        int nDevices = 0;

        for (address = 1; address < 127; address++)
        {
            I2C_2.beginTransmission(address);
            error = I2C_2.endTransmission();

            if (error == 0)
            {
                ESP_LOGI(L_TAG, "I2C device found at 0x%x !", address);
                nDevices++;
            }
            else if (error == 4)
            {
                ESP_LOGI(L_TAG, "Unknown error at address 0x%x !", address);
            }
        }
        if (nDevices == 0)
            ESP_LOGI(L_TAG, "No I2C devices found\n");
        else
            ESP_LOGI(L_TAG, "Done\n");
        I2C_2.end();
    }

    static String getErrorDesciption(byte errorCode)
    {

        String newStatus;

        switch (errorCode)
        {
        case 1:

            newStatus = "Data too long to fit in transmit buffer";
            break;
        case 2:
            newStatus = "Received NACK on transmit of address";
            break;
        case 3:
            newStatus = "Received NACK on transmit of data";
            break;
        case 4:
            newStatus = "Other error";
            break;
        case 5:
            newStatus = "Timeout";
            break;
        default:
            newStatus = "Can't identify the error";
        }
        return newStatus;
    }

    byte endTransmission(void)
    {
        for (int attempts = 0; attempts < 6; attempts++)
        {
            byte error = TwoWire::endTransmission();

            if (error != 0)
            {
                ESP_LOGI(L_TAG, "wire transmit returned %u", error);

                if (error == 5 && attempts < 3)
                {
                    // timeout
                    continue;
                }
                if (onerror)
                {
                    String errorText = ThreeWire::getErrorDesciption(error);
                    onerror(errorText, attempts);
                }
            }

            return error;
        }
        // should never get here
        assert(false);
    }
};

#endif
