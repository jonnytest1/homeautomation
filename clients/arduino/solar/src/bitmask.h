

#pragma once
#include <Arduino.h>
class Bitmask
{
  private:
    uint8_t value;

  public:
    void update(uint8_t bits)
    {
        value = bits;
    }

    void toggleBit(uint8_t bitIndex)
    {
        value = value ^ (1 << bitIndex);
    }

    bool isBitSet(uint8_t bitIndex)
    {
        return (value & (1 << bitIndex)) != 0;
    }

    void setBit(uint8_t bitIndex)
    {
        value = value | (1 << bitIndex);
    }

    void clearBit(uint8_t bitIndex)
    {
        value = value & ~(1 << bitIndex);
    }

    uint8_t get()
    {
        return value;
    }
};