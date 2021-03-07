/**
   Copyright (c) 2011 panStamp <contact@panstamp.com>

   This file is part of the panStamp project.

   panStamp  is free software; you can redistribute it and/or modify
   it under the terms of the GNU Lesser General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   any later version.

   panStamp is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU Lesser General Public License for more details.

   You should have received a copy of the GNU Lesser General Public License
   along with panStamp; if not, write to the Free Software
   Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301
   USA

   Author: Daniel Berenguer
   Creation date: 03/03/2011
*/

#include "cc1101.h"

/**
   Macros
*/
// Select (SPI) CC1101
#define cc1101_Select()  bitClear(PORT_SPI_SS, BIT_SPI_SS)
// Deselect (SPI) CC1101
#define cc1101_Deselect()  bitSet(PORT_SPI_SS, BIT_SPI_SS)
// Wait until SPI MISO line goes low
#define wait_Miso()  while(bitRead(PORT_SPI_MISO, BIT_SPI_MISO))
// Get GDO0 pin state
#define getGDO0state()  bitRead(PORT_GDO0, BIT_GDO0)
// Wait until GDO0 line goes high
#define wait_GDO0_high()  while(!getGDO0state())
// Wait until GDO0 line goes low
#define wait_GDO0_low()  while(getGDO0state())

/**
   PATABLE
*/
//const byte paTable[8] = {0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x60};

/**
   CC1101

   Class constructor
*/
CC1101::CC1101(void)
{
  paTableByte = PA_LongDistance;            // Priority = High power
}

/**
   wakeUp

   Wake up CC1101 from Power Down state
*/
void CC1101::wakeUp(void)
{
  cc1101_Select();                      // Select CC1101
  wait_Miso();                          // Wait until MISO goes low
  cc1101_Deselect();                    // Deselect CC1101
}

/**
   writeReg

   Write single register into the CC1101 IC via SPI

   'regAddr'  Register address
   'value'  Value to be writen
*/
void CC1101::writeReg(byte regAddr, byte value)
{
  cc1101_Select();                      // Select CC1101
  wait_Miso();                          // Wait until MISO goes low
  spi.send(regAddr);                    // Send register address
  spi.send(value);                      // Send value
  cc1101_Deselect();                    // Deselect CC1101
}

/**
   writeBurstReg

   Write multiple registers into the CC1101 IC via SPI

   'regAddr'  Register address
   'buffer' Data to be writen
   'len'  Data length
*/
void CC1101::writeBurstReg(byte regAddr, byte* buffer, byte len)
{
  byte addr, i;

  addr = regAddr | WRITE_BURST;         // Enable burst transfer
  cc1101_Select();                      // Select CC1101
  wait_Miso();                          // Wait until MISO goes low
  spi.send(addr);                       // Send register address

  for (i = 0 ; i < len ; i++)
    spi.send(buffer[i]);                // Send value

  cc1101_Deselect();                    // Deselect CC1101
}

/**
   cmdStrobe

   Send command strobe to the CC1101 IC via SPI

   'cmd'  Command strobe
*/
void CC1101::cmdStrobe(byte cmd)
{
  cc1101_Select();                      // Select CC1101
  wait_Miso();                          // Wait until MISO goes low
  spi.send(cmd);                        // Send strobe command
  cc1101_Deselect();                    // Deselect CC1101
}

void CC1101::waitMiso()
{
  wait_Miso();                          // Wait until MISO goes low
}

/**
   readReg

   Read CC1101 register via SPI

   'regAddr'  Register address
   'regType'  Type of register: CC1101_CONFIG_REGISTER or CC1101_STATUS_REGISTER

   Return:
    Data byte returned by the CC1101 IC
*/
byte CC1101::readReg(byte regAddr, byte regType)
{
  byte addr, val;

  addr = regAddr | regType;
  cc1101_Select();                      // Select CC1101
  wait_Miso();                          // Wait until MISO goes low
  spi.send(addr);                       // Send register address
  val = spi.send(0x00);                 // Read result
  cc1101_Deselect();                    // Deselect CC1101

  return val;
}

/**
   readBurstReg

   Read burst data from CC1101 via SPI

   'buffer' Buffer where to copy the result to
   'regAddr'  Register address
   'len'  Data length
*/
void CC1101::readBurstReg(byte * buffer, byte regAddr, byte len)
{
  byte addr, i;

  addr = regAddr | READ_BURST;
  cc1101_Select();                      // Select CC1101
  wait_Miso();                          // Wait until MISO goes low
  spi.send(addr);                       // Send register address
  for (i = 0 ; i < len ; i++)
    buffer[i] = spi.send(0x00);         // Read result byte by byte
  cc1101_Deselect();                    // Deselect CC1101
}

/**
   reset

   Reset CC1101
*/
void CC1101::reset(void)
{

  
  cc1101_Deselect();                    // Deselect CC1101
  
  delayMicroseconds(5);
  cc1101_Select();                      // Select CC1101
  delayMicroseconds(10);
  cc1101_Deselect();                    // Deselect CC1101
  delayMicroseconds(41);
  cc1101_Select();                      // Select CC1101

  wait_Miso();                          // Wait until MISO goes low
  
  spi.send(CC1101_SRES);                // Send reset command strobe
  wait_Miso();                          // Wait until MISO goes low

  cc1101_Deselect();                    // Deselect CC1101

  //setDefaultRegs();                     // Reconfigure CC1101
}

/**
   setDefaultRegs

   Configure CC1101 registers
*/
void CC1101::setDefaultRegs(void)
{
  writeReg(CC1101_IOCFG2,  CC1101_DEFVAL_IOCFG2);
  writeReg(CC1101_IOCFG1,  CC1101_DEFVAL_IOCFG1);
  writeReg(CC1101_IOCFG0,  CC1101_DEFVAL_IOCFG0);
  writeReg(CC1101_FIFOTHR,  CC1101_DEFVAL_FIFOTHR);
  writeReg(CC1101_PKTLEN,  CC1101_DEFVAL_PKTLEN);
  writeReg(CC1101_PKTCTRL1,  CC1101_DEFVAL_PKTCTRL1);
  writeReg(CC1101_PKTCTRL0,  CC1101_DEFVAL_PKTCTRL0);

  // Set default synchronization word
  setSyncWord(CC1101_DEFVAL_SYNC1, CC1101_DEFVAL_SYNC0);

  // Set default device address
  setDevAddress(CC1101_DEFVAL_ADDR);
  // Set default frequency channel
  setChannel(CC1101_DEFVAL_CHANNR);

  writeReg(CC1101_CHANNR,  CC1101_DEFVAL_CHANNR);
  writeReg(CC1101_ADDR,  CC1101_DEFVAL_ADDR);

  writeReg(CC1101_FSCTRL1,  CC1101_DEFVAL_FSCTRL1);
  writeReg(CC1101_FSCTRL0,  CC1101_DEFVAL_FSCTRL0);

  // Set default carrier frequency = 868 MHz
  setCarrierFreq(CFREQ_433);

  writeReg(CC1101_MDMCFG4,  CC1101_DEFVAL_MDMCFG4);
  writeReg(CC1101_MDMCFG3,  CC1101_DEFVAL_MDMCFG3);
  writeReg(CC1101_MDMCFG2,  CC1101_DEFVAL_MDMCFG2);
  writeReg(CC1101_MDMCFG1,  CC1101_DEFVAL_MDMCFG1);
  writeReg(CC1101_MDMCFG0,  CC1101_DEFVAL_MDMCFG0);
  writeReg(CC1101_DEVIATN,  CC1101_DEFVAL_DEVIATN);

  writeReg(CC1101_PKTLEN,  CC1101_DEFVAL_PKTLEN);
  writeReg(CC1101_PKTCTRL1,  CC1101_DEFVAL_PKTCTRL1);
  writeReg(CC1101_PKTCTRL0,  CC1101_DEFVAL_PKTCTRL0);

  writeReg(CC1101_MCSM2,  CC1101_DEFVAL_MCSM2);
  writeReg(CC1101_MCSM1,  CC1101_DEFVAL_MCSM1);
  writeReg(CC1101_MCSM0,  CC1101_DEFVAL_MCSM0);
  writeReg(CC1101_FOCCFG,  CC1101_DEFVAL_FOCCFG);
  writeReg(CC1101_BSCFG,  CC1101_DEFVAL_BSCFG);
  writeReg(CC1101_AGCCTRL2,  CC1101_DEFVAL_AGCCTRL2);
  writeReg(CC1101_AGCCTRL1,  CC1101_DEFVAL_AGCCTRL1);
  writeReg(CC1101_AGCCTRL0,  CC1101_DEFVAL_AGCCTRL0);
  writeReg(CC1101_WOREVT1,  CC1101_DEFVAL_WOREVT1);
  writeReg(CC1101_WOREVT0,  CC1101_DEFVAL_WOREVT0);
  writeReg(CC1101_WORCTRL,  CC1101_DEFVAL_WORCTRL);
  writeReg(CC1101_FREND1,  CC1101_DEFVAL_FREND1);
  writeReg(CC1101_FREND0,  CC1101_DEFVAL_FREND0);
  writeReg(CC1101_FSCAL3,  CC1101_DEFVAL_FSCAL3);
  writeReg(CC1101_FSCAL2,  CC1101_DEFVAL_FSCAL2);
  writeReg(CC1101_FSCAL1,  CC1101_DEFVAL_FSCAL1);
  writeReg(CC1101_FSCAL0,  CC1101_DEFVAL_FSCAL0);
  writeReg(CC1101_RCCTRL1,  CC1101_DEFVAL_RCCTRL1);
  writeReg(CC1101_RCCTRL0,  CC1101_DEFVAL_RCCTRL0);
  writeReg(CC1101_FSTEST,  CC1101_DEFVAL_FSTEST);
  writeReg(CC1101_PTEST,  CC1101_DEFVAL_PTEST);
  writeReg(CC1101_AGCTEST,  CC1101_DEFVAL_AGCTEST);
  writeReg(CC1101_TEST2,  CC1101_DEFVAL_TEST2);
  writeReg(CC1101_TEST1,  CC1101_DEFVAL_TEST1);
  writeReg(CC1101_TEST0,  CC1101_DEFVAL_TEST0);
}

/**
   init

   Initialize CC1101
*/
void CC1101::init(void)
{
  spi.init();                           // Initialize SPI interface
  //spi.setClockDivider(SPI_CLOCK_DIV16);
  //spi.setBitOrder(MSBFIRST);
  pinMode(GDO0, INPUT);                 // Config GDO0 as input
  
  reset();                              // Reset CC1101

  // Configure PATABLE
  //writeBurstReg(CC1101_PATABLE, (byte*)paTable, 8);
  //writeReg(CC1101_PATABLE, paTableByte);
}

/**
   setSyncWord

   Set synchronization word

   'syncH'  Synchronization word - High byte
   'syncL'  Synchronization word - Low byte
*/
void CC1101::setSyncWord(uint8_t syncH, uint8_t syncL)
{
  if ((syncWord[0] != syncH) || (syncWord[1] != syncL))
  {
    writeReg(CC1101_SYNC1, syncH);
    writeReg(CC1101_SYNC0, syncL);
    syncWord[0] = syncH;
    syncWord[1] = syncL;
  }
}

/**
   setSyncWord (overriding method)

   Set synchronization word

   'syncH'  Synchronization word - pointer to 2-byte array
*/
void CC1101::setSyncWord(byte *sync)
{
  CC1101::setSyncWord(sync[0], sync[1]);
}

/**
   setDevAddress

   Set device address

   'addr' Device address
*/
void CC1101::setDevAddress(byte addr)
{
  if (devAddress != addr)
  {
    writeReg(CC1101_ADDR, addr);
    devAddress = addr;
  }
}

/**
   setChannel

   Set frequency channel

   'chnl' Frequency channel
*/
void CC1101::setChannel(byte chnl)
{
  if (channel != chnl)
  {
    writeReg(CC1101_CHANNR,  chnl);
    channel = chnl;
  }
}

/**
   setCarrierFreq

   Set carrier frequency

   'freq' New carrier frequency
*/
void CC1101::setCarrierFreq(byte freq)
{
  switch (freq)
  {
    case CFREQ_915:
      writeReg(CC1101_FREQ2,  CC1101_DEFVAL_FREQ2_915);
      writeReg(CC1101_FREQ1,  CC1101_DEFVAL_FREQ1_915);
      writeReg(CC1101_FREQ0,  CC1101_DEFVAL_FREQ0_915);
      break;
    case CFREQ_433:
      writeReg(CC1101_FREQ2,  CC1101_DEFVAL_FREQ2_433);
      writeReg(CC1101_FREQ1,  CC1101_DEFVAL_FREQ1_433);
      writeReg(CC1101_FREQ0,  CC1101_DEFVAL_FREQ0_433);
      break;
    default:
      writeReg(CC1101_FREQ2,  CC1101_DEFVAL_FREQ2_868);
      writeReg(CC1101_FREQ1,  CC1101_DEFVAL_FREQ1_868);
      writeReg(CC1101_FREQ0,  CC1101_DEFVAL_FREQ0_868);
      break;
  }

  carrierFreq = freq;
}

/**
   setPowerDownState

   Put CC1101 into power-down state
*/
void CC1101::setPowerDownState()
{
  // Comming from RX state, we need to enter the IDLE state first
  cmdStrobe(CC1101_SIDLE);
  // Enter Power-down state
  cmdStrobe(CC1101_SPWD);
}

/**
   sendData

   Send data packet via RF

   'packet' Packet to be transmitted. First byte is the destination address

    Return:
      True if the transmission succeeds
      False otherwise
*/
boolean CC1101::sendData(byte* packet, byte pktlength)
{
  byte marcState;
  bool res = false;

  // Declare to be in Tx state. This will avoid receiving packets whilst
  // transmitting
  rfState = RFSTATE_TX;

  /*
    // Enter RX state
    setRxState();

    // Check that the RX state has been entered
    while (((marcState = readStatusReg(CC1101_MARCSTATE)) & 0x1F) != 0x0D)
    {
      if (marcState == 0x11)        // RX_OVERFLOW
        flushRxFifo();              // flush receive queue
    }
  */

  /*
    Serial.println("Sending packet: ");
    for (int p=0; p<pktlength; p++)
    {
      Serial.print(packet[p], HEX);
    }
    Serial.println();
  */

  // Set data length at the first position of the TX FIFO (not needed, since we set the PKTLEN register)
  //writeReg(CC1101_TXFIFO,  packet.length);
  // Write data into the TX FIFO
  writeBurstReg(CC1101_TXFIFO, packet, pktlength);

  // CCA enabled: will enter TX state only if the channel is clear
  setTxState();


  // Check that TX state is being entered (state = RXTX_SETTLING)
  marcState = readStatusReg(CC1101_MARCSTATE) & 0x1F;
  if ((marcState != 0x13) && (marcState != 0x14) && (marcState != 0x15) && (marcState != 0x07))
  {
    setIdleState();       // Enter IDLE state
    flushTxFifo();        // Flush Tx FIFO

    // Declare to be in idle state
    rfState = RFSTATE_IDLE;
    return false;
  }

  // Wait for the sync word to be transmitted
  //Serial.print("Waiting for GDO0 high... ");
  wait_GDO0_high();

  // Wait until the end of the packet transmission
  //Serial.print("Waiting for GDO0 low... ");
  wait_GDO0_low();

  // Check that the TX FIFO is empty
  if ((readStatusReg(CC1101_TXBYTES) & 0x7F) == 0)
    res = true;

  setIdleState();       // Enter IDLE state
  flushTxFifo();        // Flush Tx FIFO

  // Enter back into RX state
  //setRxState();

  // Declare to be in Rx state
  rfState = RFSTATE_IDLE;

  return res;
}

/**
   receiveData

   Read data packet from RX FIFO

   'packet' Container for the packet received
   'pktlen' Packet length

   Return:
    Amount of bytes received
*/
byte CC1101::receiveData(byte * packet, byte pktlen)
{
  byte val;
  byte rxBytes = readStatusReg(CC1101_RXBYTES);

  // Any byte waiting to be read and no overflow?
  if (rxBytes & 0x7F && !(rxBytes & 0x80))
  {
    // Read data length
    pktlen = readConfigReg(CC1101_RXFIFO);
    // If packet is too long
    if (pktlen > 64)
      pktlen = 0;   // Discard packet
    else
    {
      // Read data packet
      readBurstReg(packet, CC1101_RXFIFO, pktlen);
      // Read RSSI
      //packet->rssi = readConfigReg(CC1101_RXFIFO);
      // Read LQI and CRC_OK
      val = readConfigReg(CC1101_RXFIFO);
      //packet->lqi = val & 0x7F;
      //packet->crc_ok = bitRead(val, 7);
    }
  }
  else
    pktlen = 0;

  setIdleState();       // Enter IDLE state
  flushRxFifo();        // Flush Rx FIFO
  //cmdStrobe(CC1101_SCAL);

  // Back to RX state
  setRxState();

  return pktlen;
}
