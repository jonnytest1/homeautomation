#include "heltec.h"
#include "lib/str.h"
#include "shared.h"
#include <Arduino.h>

class Screen : public StatusUpdater
{

  private:
    SSD1306Wire display;

    int statusWritten = millis();

  public:
    String statusLine = "";
    String statusLine2 = "";
    String statusLine3 = "";
    String statusLine4 = "_test";
    Screen() : display(0x3c, SDA_OLED, SCL_OLED, RST_OLED) {};

    void init()
    {

        display.init();
        display.setFont(ArialMT_Plain_10);
        display.clear();
        display.screenRotate(ANGLE_0_DEGREE);
        display.clear();
    }

    void updateStatus(String newStatus) override
    {
        ESP_LOGI(L_TAG, "status update %s", newStatus.c_str());
        statusWritten = millis();
        statusLine = newStatus;
    }

    void printScreen()
    {
        display.clear();

        String lastUpdate = "since: ";
        lastUpdate += itos((int)(millis() - statusWritten)).c_str();
        display.drawString(0, 0, lastUpdate);
        display.drawString(0, 13, statusLine);
        display.drawString(0, 26, statusLine2);
        display.drawString(0, 39, statusLine3);
        display.drawString(0, 52, statusLine4);
        display.display();
    }

    void showStatus(String status)
    {
        display.clear();
        display.drawString(0, 32 - 16 / 2, status);
        display.display();
    }

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
};