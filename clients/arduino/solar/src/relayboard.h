
#include <Wire.h>
#include <Arduino.h>

typedef std::function<void(bool state)> OnChange;

class RelayBoardIndex
{
private:
  RelayBoard16 *boardRef;
  int index;

public:
  long lastOnTimestamp = 0;
  long lastOffTimestamp = 0;
  long lastOnAttempt = 0;
  long lastOffAttempt = 0;
  boolean currentState = false;
  OnChange onchange = nullptr;

  RelayBoardIndex(RelayBoard16 *boardRef, int index) : boardRef(boardRef), index(index)
  {
  }

  boolean on()
  {
    lastOnAttempt = millis();
    if (currentState == true)
    {
      return false;
    }
    lastOnTimestamp = millis();
    currentState = true;
    boardRef->setRelay(index, true);

    if (onchange != nullptr)
    {
      onchange(currentState);
    }

    return true;
  }
  boolean off()
  {
    lastOffAttempt = millis();
    if (currentState == false)
    {
      return false;
    }

    _off();
    if (onchange != nullptr)
    {
      onchange(currentState);
    }
    return true;
  }

  void _off()
  {
    lastOffTimestamp = millis();
    currentState = false;
    boardRef->setRelay(index, false);
  }
};

class RelayBoard16
{

private:
  int sdc;
  int sda;
  int address;

  void writeRegister(uint8_t reg, uint8_t value)
  {
    Wire.beginTransmission(address);
    Wire.write(reg);
    Wire.write(value);
    Wire.endTransmission();
  };

public:
  uint8_t rowA = 0;
  uint8_t rowB = 0;
  RelayBoard16(int address) : address(address)
  {

    writeRegister(0x06, 0x00); // Configuration Port 0
    writeRegister(0x07, 0x00); // Configuration Port 1
  };

  RelayBoardIndex *forIndex(int index)
  {
    return new RelayBoardIndex(this, index);
  }

  void update()
  {

    Serial.println(rowA);
    Serial.println(rowB);
    writeRegister(0x02, rowA); // Output Port 0
    writeRegister(0x03, rowB); // Output Port 1
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

  void setRelay(int index, bool on)
  {
    patchRelay(index, on);
    update();
  }
};