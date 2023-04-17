#include <Arduino.h>
#include "CC1101_ESP_Arduino.h"
#include <EspBitBanger.h>
#include "ArduinoOTA.h"
#include "lib/http.h"
#define PORT 80

const int SPI_SCK = 18;          // board or mcu specific
const int SPI_MISO = 19;         // board or mcu specific
const int SPI_MOSI = 23;         // board or mcu specific
const int SPI_CS = 5;            // select any pin
const int RADIO_INPUT_PIN = 12;  // select any pin, this is the TX-PIN
const int RADIO_OUTPUT_PIN = 13; // select any pin, this is the RX-PIN

CC1101 cc1101(SPI_SCK, SPI_MISO, SPI_MOSI, SPI_CS, RADIO_INPUT_PIN, RADIO_OUTPUT_PIN);

uint8_t bufferEx[] = {
    0b11101110,
    0b10001110,
    0b10001000,
    0b10001110,
    0b11101110,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b11101110,
    0b10001110,
    0b10001110,
    0b10000000};

// 0b11101110, 111=long on 0 = short off
// 0b10001110, 1 = short on 000 = long off
uint8_t bufferSlower[] = {
    0b11101000, // long short
    0b10001000, // short short
    0b11101000, // long short
    0b10001000, // short short
    0b10001110, // short long
    0b11101000, // long short
    0b11101000, // long short
    0b10001110, // short long
    0b10001000, // short short
    0b10001000, // short short
    0b11101000, // long short
    0b11101000, // long short
    0b10000000, // short long
};
uint8_t bufferPwr[] = {
    0b11101000, // long short
    0b10001000, // short short
    0b11101000, // long short

    0b10001000, // short short
    0b10001110, // short long
    0b11101000, // long short

    0b11101000, // long short
    0b10001110, // short long
    0b10001000, // short short

    0b10001000, // short short
    0b11101110, // long long
    0b11101000, // long short
    0b10000000, // short -
};

void sendBits(uint8_t bitBuffer[], int bSize, int baud)
{

    EspBitBanger bitBanger;
    // int baud = 2466;

    Serial.println(baud);
    Serial.println(bSize);

    bitBanger.begin(baud, -1, RADIO_INPUT_PIN);

    Serial.println("sending");
    cc1101.setMHZ(433.99);
    cc1101.setTXPwr(TX_PLUS_10_DBM);
    cc1101.setDataRate(10000);
    cc1101.setModulation(ASK_OOK);

    cc1101.setTx();
    for (int i = 0; i < 5; i++)
    {
        delay(10);
        bitBanger.write(bitBuffer, bSize);
    }
    cc1101.setIdle();
    Serial.println("reidle");
    delay(1000);

    Serial.println("loop done");
}

String onRequest(HttpRequest *request)
{
    //

    if (request->path.indexOf("pwr") > -1)
    {
        Serial.println("pwr");
        sendBits(bufferPwr, sizeof(bufferPwr) / sizeof(bufferPwr[0]), 2466);
    }
    else if (request->path.indexOf("minus") > -1)
    {
        Serial.println("minus");
        sendBits(bufferSlower, sizeof(bufferSlower) / sizeof(bufferSlower[0]), 2466);
    }

    return "done";
}

HttpServer server(PORT, onRequest);

void setup()
{
    Serial.begin(115200);
    Serial.println("start");

    server.begin();
    Serial.println("server started");

    String otaPassword = "fskz570s-36inwky3-m8y4kg28-wh3xzzaf"; // generateUuid();

    ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
    ArduinoOTA.setPassword(otaPassword.c_str());
    ArduinoOTA.begin();
    Serial.println("ArduinoOTA started");
    cc1101.init();
    Serial.println("init cc1101");
    Serial.printf("CC1101: 0x%02x, version: 0x%02x\n", cc1101.getPartnum(), cc1101.getVersion());
}

void loop()
{
    ArduinoOTA.handle();
    server.step();
    // put your main code here, to run repeatedly:
}