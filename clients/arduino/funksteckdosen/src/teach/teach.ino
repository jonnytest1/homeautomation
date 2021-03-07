#include "transmitter.h"
#include "cc1101.h"

CC1101 cc1101;
int received_number = 0;
const int n = 61;
byte buffer[n] = "";
//int i;

byte RX_buffer[11] = {0};
byte size, i, flag;

void setup() {
  Serial.begin(9600);
   Serial.println("start");
   //ELECHOUSE_cc1101.Init(F_433);
   ELECHOUSE_cc1101.Init();
    ELECHOUSE_cc1101.SetReceive();
Serial.println("Initializing CC1101.");
  //cc1101.init();

  //Serial.println("Setting up the PA_TABLE.");
 // byte PA_TABLE[] = {0x00,0xc0,0x00,0x00,0x00,0x00,0x00,0x00}; // 10dBm
 // cc1101.writeBurstReg(CC1101_PATABLE, PA_TABLE, 8);

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
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL3, 0xE9);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL2, 0x2A);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL1, 0x00);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_FSCAL0, 0x1F);   // Frequency Synthesizer Calibration
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST2, 0x81);    // Various Test Settings
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST1, 0x35);    // Various Test Settings
  ELECHOUSE_cc1101.SpiWriteReg(CC1101_TEST0, 0x09);    // Various Test Settings
  delay(1000);
  Serial.println("CC1101 initialized.");
}


void sendoncode() {
  // 0000010101010101001100110
// 1000100010001000100011101000111010001110100011101000111010001110100010001110111010001000111011101000
  //G00f0f153292953000110001100011000110001100011
  byte ondata[13] = { 0x88, 0x88, 0x8E, 0x8E, 0x8E, 0x8E, 0x8E, 0x8E, 0x88, 0xEE, 0x88, 0xEE, 0x80 };
  //sending = true;
 // ELECHOUSE_cc1101.SendData(ondata, 13);

  //24366c
  //2102c5
  //hc  0110 1110 0000
  //on 10010011
  byte offdata[10] = {0x01, 0x10, 0x11, 0x10, 0x00, 0x00,0x10 ,0x01,0x00,0x11};
 
    // String tx_message = "0110,00110001,10001100,01100011";
  //int m_length = tx_message.length();
 // byte txbyte[m_length];
 // tx_message.getBytes(txbyte, m_length + 1);
   ELECHOUSE_cc1101.SendData(offdata, 10);

//0011b0 011b00 11b001 1b0011
  byte ondatathr[12] = {0x00, 0x11, 0xb0 , 0x01, 0x1b, 0x00,  0x11, 0xb0, 0x01 ,0x1b,0x00,0x11};
  //byte ondatasec[15] = {0x00, 0x01, 0x10 , 0x00, 0x11, 0x00,  0x01, 0x10, 0x00 ,0x11,0x00,0x01,0x10,0x00,0x11};
    // String tx_message = "0110,00110001,10001100,01100011";
  //int m_length = tx_message.length();
 // byte txbyte[m_length];
 // tx_message.getBytes(txbyte, m_length + 1);
   ELECHOUSE_cc1101.SendData(ondatathr, 12);
}

void sendoffcode() {
  //22678c
  byte offdata[13] = { 0x22, 0x67, 0x8c };
  //sending = true;
  ELECHOUSE_cc1101.SendData(offdata, 3);
 // sending = false;
}


void loop() {
   if (ELECHOUSE_cc1101.CheckReceiveFlag())
    {
        size = ELECHOUSE_cc1101.ReceiveData(RX_buffer);
        for (i = 0; i < i; i++)
        {
            received_number = RX_buffer[i];
            Serial.println(received_number);
        }
        ELECHOUSE_cc1101.SetReceive();
    }
 /* Serial.println("send off");
   delay(100);
  sendoffcode();
  Serial.println("sent");
delay(1000);
   Serial.println("send on");
    delay(100);
     sendoncode();
      Serial.println("sent");
  delay(1000);*/
  
  /*i++;
  delay(200);
 // char character = (char) i;
  
  Serial.println(""+String(i));
  int m_length = 4;//tx_message.length();
  byte txbyte[m_length];

  txbyte[0] = i;
  
  ELECHOUSE_cc1101.SendData(txbyte, m_length);
  if(i>100){
    i=0;
      Serial.println("restart");
  }*/
  
  Serial.println("done lop");
 /*if (Serial.available()) {
   
  }*/
}

void cc1101_SetupRegisters() {
  //
  // Rf settings for CC1101
  //
  cc1101.writeReg(CC1101_IOCFG0, 0x06);   // GDO0 Output Pin Configuration
  cc1101.writeReg(CC1101_FIFOTHR, 0x47);  // RX FIFO and TX FIFO Thresholds
  cc1101.writeReg(CC1101_PKTLEN, 0x0D);   // Packet Length
  cc1101.writeReg(CC1101_PKTCTRL0, 0x00); // Packet Automation Control
  cc1101.writeReg(CC1101_FSCTRL1, 0x06);  // Frequency Synthesizer Control
//  cc1101.writeReg(CC1101_FREQ2, 0x10);    // Frequency Control Word, High Byte
//  cc1101.writeReg(CC1101_FREQ1, 0xB0);    // Frequency Control Word, Middle Byte
//  cc1101.writeReg(CC1101_FREQ0, 0xB3);    // Frequency Control Word, Low Byte
  cc1101.writeReg(CC1101_MDMCFG4, 0xF7);  // Modem Configuration
  cc1101.writeReg(CC1101_MDMCFG3, 0xB0);  // Modem Configuration
  cc1101.writeReg(CC1101_MDMCFG2, 0x30);  // Modem Configuration
  cc1101.writeReg(CC1101_MDMCFG1, 0x00);  // Modem Configuration
  cc1101.writeReg(CC1101_MDMCFG0, 0x2E);  // Modem Configuration
  cc1101.writeReg(CC1101_DEVIATN, 0x15);  // Modem Deviation Setting
  cc1101.writeReg(CC1101_MCSM0, 0x14);    // Main Radio Control State Machine Configuration
  cc1101.writeReg(CC1101_FOCCFG, 0x16);   // Frequency Offset Compensation Configuration
  cc1101.writeReg(CC1101_WORCTRL, 0xFB);  // Wake On Radio Control
  cc1101.writeReg(CC1101_FREND0, 0x11);   // Front End TX Configuration
  cc1101.writeReg(CC1101_FSCAL3, 0xE9);   // Frequency Synthesizer Calibration
  cc1101.writeReg(CC1101_FSCAL2, 0x2A);   // Frequency Synthesizer Calibration
  cc1101.writeReg(CC1101_FSCAL1, 0x00);   // Frequency Synthesizer Calibration
  cc1101.writeReg(CC1101_FSCAL0, 0x1F);   // Frequency Synthesizer Calibration
  cc1101.writeReg(CC1101_TEST2, 0x81);    // Various Test Settings
  cc1101.writeReg(CC1101_TEST1, 0x35);    // Various Test Settings
  cc1101.writeReg(CC1101_TEST0, 0x09);    // Various Test Settings
}
