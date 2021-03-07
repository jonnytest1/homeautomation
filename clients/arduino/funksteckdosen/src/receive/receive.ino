/* 1byte CC1101 Receiver example.
/* Tutorial link: http://electronoobs.com/eng_arduino_tut98.php
 * Code: http://electronoobs.com/eng_arduino_tut98_code2.php
 * Scheamtic: http://electronoobs.com/eng_arduino_tut98_sch1.php
 * Youtube Channel: http://www.youtube/c/electronoobs   
// Arduino          CC1101
// GND              GND
// 3.3V             VCC
// D10              CSN/SS   **** Must be level shifted to 3.3V
// D11              SI/MOSI  **** Must be level shifted to 3.3V
// D12              SO/MISO
// D13              SCK      **** Must be level shifted to 3.3V
// D2               GD0
*/

#include "transmitter.h"
int received_number = 0;

void setup()
{
    Serial.begin(9600);

    Serial.println("init");
    ELECHOUSE_cc1101.Init();
    ELECHOUSE_cc1101.SetReceive();
      Serial.println("Setting up the registers.");
  //cc1101_SetupRegisters();
    ELECHOUSE_cc1101.SpiWriteReg(CC1101_IOCFG0, 0x06);   // GDO0 Output Pin Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FIFOTHR, 0x47);  // RX FIFO and TX FIFO Thresholds
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_PKTLEN, 0x0D);   // Packet Length
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_PKTCTRL0, 0x00); // Packet Automation Control
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCTRL1, 0x06);  // Frequency Synthesizer Control
//  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREQ2, 0x10);    // Frequency Control Word, High Byte
//  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREQ1, 0xB0);    // Frequency Control Word, Middle Byte
//  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREQ0, 0xB3);    // Frequency Control Word, Low Byte
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG4, 0xF7);  // Modem Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG3, 0xB0);  // Modem Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG2, 0x30);  // Modem Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG1, 0x00);  // Modem Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG0, 0x2E);  // Modem Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_DEVIATN, 0x15);  // Modem Deviation Setting
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MCSM0, 0x14);    // Main Radio Control State Machine Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FOCCFG, 0x16);   // Frequency Offset Compensation Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_WORCTRL, 0xFB);  // Wake On Radio Control
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREND0, 0x11);   // Front End TX Configuration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL3, 0x03);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL2, 0x2D);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL1, 0x00);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL0, 0x1F);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST2, 0x81);    // Various Test Settings
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST1, 0x35);    // Various Test Settings
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST0, 0x09);    // Various Test Settings
   Serial.println("set up the registers.");
}

byte RX_buffer[11] = {0};
byte size, i, flag;

void loop()
{
    Serial.println("check receive");
    if (ELECHOUSE_cc1101.CheckReceiveFlag())
    {
       Serial.println("got receive");
        size = ELECHOUSE_cc1101.ReceiveData(RX_buffer);
        for (i = 0; i < i; i++)
        {
            received_number = RX_buffer[i];
            Serial.println(received_number);
        }
        ELECHOUSE_cc1101.SetReceive();
    }
}
