#include <Arduino.h>

void setup()
{
    // put your setup code here, to run once:
    Serial.begin(115200);
    Serial.println("start");
}

void loop()
{
    // put your main code here, to run repeatedly:

    Serial.println("Guru Meditation Error: Core  0 panic'ed (StoreProhibited). Exception was unhandled.\n\nCore  0 register dump:\nPC      : 0x40091878  PS      : 0x00060533  A0      : 0x800938f0  A1      : 0x3ffbace0\nA2      : 0xe5004136  A3      : 0xb33fffff  A4      : 0x0000abab  A5      : 0x00060523\nA6      : 0x00060520  A7      : 0x0000cdcd  A8      : 0x0000cdcd  A9      : 0xffffffff\nA10     : 0x00000008  A11     : 0x3ffc6d3c  A12     : 0x00000000  A13     : 0x00060123\nA14     : 0xa5804136  A15     : 0x003fffff  SAR     : 0x00000019  EXCCAUSE: 0x0000001d\nEXCVADDR: 0xe5004136  LBEG    : 0x40084611  LEND    : 0x40084619  LCOUNT  : 0x00000027\n\n\nBacktrace: 0x40091875:0x3ffbace0 0x400938ed:0x3ffbad20 0x40093b85:0x3ffbad40 0x40083bb6:0x3ffbad60 0x40083bc9:0x3ffbad90 0x40083bf6:0x3ffbadb0 0x40093f61:0x3ffbadd0 0x400838f9:0x3ffbadf0 0x40151c9b:0x3ffbae10 0x4015a94b:0x3ffbae30 0x40157eb1:0x3ffbae50 0x40117647:0x3ffbae70");
    delay(1000);
}