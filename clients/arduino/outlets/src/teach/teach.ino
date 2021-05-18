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
   ELECHOUSE_cc1101.Init(F_433);
 // cc1101.init();
    Serial.println("patable");
  //  byte PA_TABLE[] = {0x00,0xc0,0x00,0x00,0x00,0x00,0x00,0x00}; // 10dBm
//  cc1101.writeBurstReg(CC1101_PATABLE, PA_TABLE, 8);

  Serial.println("Initializing CC1101.");
  Serial.println("Setting up the registers.");
  // cc1101_SetupRegisters();
  delay(1000);
  Serial.println("CC1101 initialized.");
}


void sendoncode() {
  // 0000010101010101001100110
// 1000100010001000100011101000111010001110100011101000111010001110100010001110111010001000111011101000
  //G00f0f153292953000110001100011000110001100011
  byte ondata[8] = { 0x88, 0x88, 0x8E, 0x8E, 0x8E, 0x8E, 0x8E, 0x8E};
  //sending = true;
  //  Serial.print("send cc1101t ");
 // ELECHOUSE_cc1101.SendData(ondata, 8);

  //24366c
  //2102c5
  //hc  0110 1110 0000
  //on 10010011
 // byte offdata[10] = {0x01, 0x10, 0x11, 0x10, 0x00, 0x00,0x10 ,0x01,0x00,0x11};
 
    // String tx_message = "0110,00110001,10001100,01100011";
  //int m_length = tx_message.length();
 // byte txbyte[m_length];
 // tx_message.getBytes(txbyte, m_length + 1);
   //ELECHOUSE_cc1101.SendData(offdata, 10);

//0011b0 011b00 11b001 1b0011
  //byte ondatathr[12] = {0xFF, 0xFF, 0xFF , 0xFF, 0xFF, 0xFF,  0xFF, 0xFF, 0xFF ,0xFF,0xFF,0xFF};
  byte ondatasec[15] = {0x00, 0x01, 0x10 , 0x00, 0x11, 0x00,  0x01, 0x10, 0x00 ,0x11,0x00,0x01,0x10,0x00,0x11};
    // String tx_message = "0110,00110001,10001100,01100011";
  // ELECHOUSE_cc1101.SendData(ondatasec, 15);
  boolean worked=false;
  
    Serial.println("50 loop");
  for(int i=0;i<3;i++){
     if(cc1101.sendData(ondatasec, 15)){
      worked=true;
    }
    Serial.print("sentindex ");
  }
    Serial.print("sent ");
    Serial.println(worked);
}

void loop() {
    delay(2000);
    Serial.println("send on");
  String tx_message = "Nr. of TX attempts";
  int m_length = tx_message.length();
  byte txbyte[m_length];
  tx_message.getBytes(txbyte, m_length + 1);
  Serial.println((char *)txbyte);
 // Serial.println("################################### ############################################");
  ELECHOUSE_cc1101.SendData(txbyte, m_length);
  
 /*   Serial.println("send on");
    sendoncode();
   Serial.println("reset after sent");
  delay(5000);
  Serial.println("done lop");*/
 
}

void cc1101_SetupRegisters() {
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
}
