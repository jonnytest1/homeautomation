#define PIN_DATA 10

#include <RCSwitch.h>
RCSwitch rcSwitch = RCSwitch();
RCSwitch senderSwitch = RCSwitch();
unsigned long lastAction = 0;

void setup()
{
    Serial.begin(9600);
    Serial.println("start");
    senderSwitch.enableTransmit(PIN_DATA);
    // send.setRepeatTransmit(1);
    rcSwitch.enableReceive(digitalPinToInterrupt(2)); // Receiver on interrupt 0 => that is pin #2
}

void loop()
{

    if (rcSwitch.available())
    {
        Serial.println("available");
        output(rcSwitch.getReceivedValue(), rcSwitch.getReceivedBitlength(), rcSwitch.getReceivedDelay(), rcSwitch.getReceivedRawdata(), rcSwitch.getReceivedProtocol());
        rcSwitch.resetAvailable();
    }
    if (millis() - lastAction >= 2000)
    {
        Serial.println("Sending");
        for (int i = 0; i < 4; i++)
        {
            senderSwitch.send("110110101110111110000");
            delayMicroseconds(1800000);
        }

        lastAction = millis();
    }
}

void output(unsigned long decimal, unsigned int length, unsigned int delay, unsigned int *raw, unsigned int protocol)
{

    const char *b = dec2binWzerofill(decimal, length);
    Serial.print("Decimal: ");
    Serial.print(decimal);
    Serial.print(" (");
    Serial.print(length);
    Serial.print("Bit) Binary: ");
    Serial.print(b);
    Serial.print(" Tri-State: ");
    Serial.print(bin2tristate(b));
    Serial.print(" PulseLength: ");
    Serial.print(delay);
    Serial.print(" microseconds");
    Serial.print(" Protocol: ");
    Serial.println(protocol);

    Serial.print("Raw data: ");
    for (unsigned int i = 0; i <= length * 2; i++)
    {
        Serial.print(raw[i]);
        Serial.print(",");
    }
    Serial.println();
    Serial.println();
}

const char *bin2tristate(const char *bin)
{
    static char returnValue[50];
    int pos = 0;
    int pos2 = 0;
    while (bin[pos] != '\0' && bin[pos + 1] != '\0')
    {
        if (bin[pos] == '0' && bin[pos + 1] == '0')
        {
            returnValue[pos2] = '0';
        }
        else if (bin[pos] == '1' && bin[pos + 1] == '1')
        {
            returnValue[pos2] = '1';
        }
        else if (bin[pos] == '0' && bin[pos + 1] == '1')
        {
            returnValue[pos2] = 'F';
        }
        else
        {
            return "not applicable";
        }
        pos = pos + 2;
        pos2++;
    }
    returnValue[pos2] = '\0';
    return returnValue;
}

char *dec2binWzerofill(unsigned long Dec, unsigned int bitLength)
{
    static char bin[64];
    unsigned int i = 0;

    while (Dec > 0)
    {
        bin[32 + i++] = ((Dec & 1) > 0) ? '1' : '0';
        Dec = Dec >> 1;
    }

    for (unsigned int j = 0; j < bitLength; j++)
    {
        if (j >= bitLength - i)
        {
            bin[j] = bin[31 + i - (j - (bitLength - i))];
        }
        else
        {
            bin[j] = '0';
        }
    }
    bin[bitLength] = '\0';

    return bin;
}
