#pragma once
#include "relay-board-ref.cpp"
#include <Arduino.h>

typedef std::function<void(bool state)> OnChange;

class RelayBoardIndex
{
  private:
    RelayBoardRef *boardRef = nullptr;
    int index;
    bool defaultOn = false;

  public:
    long lastOnTimestamp = 0;
    long lastOffTimestamp = 0;
    long lastOnAttempt = 0;
    long lastOffAttempt = 0;
    boolean currentState = false;
    OnChange onchange = nullptr;

    bool failedUpdate = false;

    RelayBoardIndex(RelayBoardRef *_boardRef, int index) : boardRef(_boardRef), index(index)
    {
    }

    boolean on()
    {
        lastOnAttempt = millis();
        if (currentState == true)
        {
            return false;
        }
        _on();

        if (onchange != nullptr)
        {
            onchange(currentState);
        }

        return true;
    }

    void _on()
    {
        lastOnTimestamp = millis();
        currentState = true;
        failedUpdate = false;
        if (!boardRef->setRelay(index, true ^ defaultOn))
        {
            ESP_LOGE(L_TAG, "relay index _on update failed index: %d", index);
            failedUpdate = true;
        }
    }

    RelayBoardIndex *withDefaultOn()
    {
        defaultOn = true;
        return this;
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
        failedUpdate = false;
        if (!boardRef->setRelay(index, false ^ defaultOn))
        {
            ESP_LOGE(L_TAG, "relay index _off update failed index: %d", index);
            failedUpdate = true;
        }
    }
};