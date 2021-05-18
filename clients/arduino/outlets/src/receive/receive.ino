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
//#include "cc1101.h"
//CC1101 cc1101;
void setup()
{
   Serial.begin(9600);
   // mySwitch.enableReceive(0);  // Receiver on interrupt 0 => that is pin #2
   // cc1101.init();
   // cc1101_SetupRegisters();
   Serial.println("Rx");
   ELECHOUSE_cc1101.Init(F_433);
    cc1101_SetupRegisters();
   
   ELECHOUSE_cc1101.SetReceive();
   Serial.println("set receive");
}

byte buffer[100] = {};

void loop()
{

   if (ELECHOUSE_cc1101.CheckReceiveFlag())
   {
      byte size=ELECHOUSE_cc1101.ReceiveData(buffer);
      Serial.println("read "+String(size)+" bytes");
      if(size>0){
         for(int i=0;i<100;i++){
          Serial.print((buffer)[i]);
          Serial.print(",");
        }
        Serial.println();
         String str((char *)buffer);
         Serial.println("received "+str);
      }
     
    
      ELECHOUSE_cc1101.SetReceive();
   }

   /*  byte received=cc1101.receiveData(buffer, 15);
    if(received>0){
   Serial.println("received data");
         for(int i=0;i<15;i++){
            Serial.print(buffer[i]);
         }
          Serial.println("was sent");
      
    }*/
}

void cc1101_SetupRegisters() {
    Serial.println("setting remote ");
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_IOCFG0,0x06);//GDO0 Output Pin Configuration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FIFOTHR,0x47);//RX FIFO and TX FIFO Thresholds<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_PKTCTRL0,0x06);//Packet Automation Control<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCTRL1,0x06);//Frequency Synthesizer Control<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREQ2,0x11);//Frequency Control Word, High Byte<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREQ1,0x0A);//Frequency Control Word, Middle Byte<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREQ0,0x14);//Frequency Control Word, Low Byte<br>
ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG4,0xF6);//Modem Configuration<br>
ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG3,0x43);//Modem Configuration<br>
ELECHOUSE_cc1101.SpiWriteReg(CC1101_MDMCFG2,0x30);//Modem Configuration<br>
ELECHOUSE_cc1101.SpiWriteReg(CC1101_DEVIATN,0x15);//Modem Deviation Setting<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_MCSM0,0x18);//Main Radio Control State Machine Configuration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FOCCFG,0x16);//Frequency Offset Compensation Configuration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_WORCTRL,0xFB);//Wake On Radio Control<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FREND0,0x11);//Front End TX Configuration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL3,0xE9);//Frequency Synthesizer Calibration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL2,0x2A);//Frequency Synthesizer Calibration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL1,0x00);//Frequency Synthesizer Calibration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL0,0x1F);//Frequency Synthesizer Calibration<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST2,0x81);//Various Test Settings<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST1,0x35);//Various Test Settings<br>
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST0,0x09);//Various Test Settings<br>
   Serial.println("set up the registers.");
}
