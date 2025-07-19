#pragma once
#include "relay-board-ref.cpp"
#include "relayboard-index.h"
#include <i2c.h>
/**
 * @brief
 *
 *bats(4x)
 * 7        15
 * 6        14
 * 5        13 solar
 * 4        12
 * 3        11
 * 2        10
 * 1         9
 * 0         8 landline
 *
 */
class RelayBoard16 : public RelayBoardRef
{

  private:
    int sdc;
    int sda;
    int address;
    ThreeWire *wire;
    byte transmission_error = 0;

    void writeRegister(uint8_t reg, uint8_t value)
    {
        transmission_error = 0;
        wire->beginTransmission(address);
        wire->write(reg);
        wire->write(value);

        byte error = wire->endTransmission();

        if (error != 0)
        {
            ESP_LOGE(L_TAG, "i2c transmisssion error %d", error);
            transmission_error = error;
        }
    };

  public:
    uint8_t rowA = 0;
    uint8_t rowB = 0;
    RelayBoard16(int address, ThreeWire *wire)
        : address(address), wire(wire) {

          };

    void begin()
    {
        writeRegister(0x06, 0x00); // Configuration Port 0
        writeRegister(0x07, 0x00); // Configuration Port 1
    }
    /**
     * @brief
     * 7 15
     *
     * 6 14
     *
     * 5 13
     *
     * 4 12
     *
     * 3 11
     *
     * 2 10
     *
     * 1  9
     *
     * 0  8
     * @pre
     * @param index
     * @return RelayBoardIndex*
     */
    RelayBoardIndex *forIndex(int index)
    {
        return new RelayBoardIndex(this, index);
    }

    bool update()
    {

        transmission_error = 0;
        // Serial.println(rowA);
        // Serial.println(rowB);
        writeRegister(0x02, rowA); // Output Port 0
        writeRegister(0x03, rowB); // Output Port 1

        return transmission_error == 0;
    }

    void patchRelay(int index, bool on)
    {
        if (index < 8)
        {
            if (on)
            {
                rowA |= (1 << index);
            }
            else
            {
                rowA &= ~(1 << index);
            }
        }
        else
        {
            index -= 8;
            if (on)
            {
                rowB |= (1 << index);
            }
            else
            {
                rowB &= ~(1 << index);
            }
        }
    }

    bool setRelay(int index, bool on) override
    {
        patchRelay(index, on);
        return update();
    }
};