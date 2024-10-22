export const matrixLed = `


#include <FastLED.h>

#define NUM_LEDS 64
CRGB leds[NUM_LEDS];
uint8_t end_byte = 255;

const uint8_t numberIndices[10][25] = {
    // Number 0
    {8, 9, 10, 11, 12, 13, 14, 15, 23, 31, 39, 47, 55, 54, 53, 52, 51, 50, 49, 48, 40, 32, 24, 16, end_byte}, // 0
    // Number 1
    {28, 37, 46, 45, 44, 43, 42, 41, 40, end_byte}, // 1
    // Number 2
    {21, 30, 38, 45, 44, 35, 26, 17, 16, 24, 32, 40, end_byte}, // 2
    // Number 3
    {30, 38, 45, 44, 35, 27, 42, 41, 32, 24, end_byte}, // 3
    // Number 4
    {39, 47, 30, 29, 20, 19, 27, 35, 43, 51, 46, 45, 44, 42, 41, end_byte}, // 4
    // Number 5
    {23, 31, 39, 47, 22, 21, 20, 28, 36, 43, 42, 33, 25, end_byte}, // 5
    // Number 6
    {47, 39, 30, 21, 20, 19, 18, 25, 33, 42, 43, 36, 28, end_byte}, // 6
    // Number 7
    {23, 31, 39, 47, 46, 37, 36, 27, 26, end_byte}, // 7
    // Number 8
    {31, 39, 22, 46, 21, 45, 28, 36, 19, 43, 18, 42, 25, 33, end_byte}, // 8
    // Number 9
    {31, 39, 22, 46, 21, 45, 28, 36, 44, 43, 42, 33, 25, 17, end_byte}, // 9
};


void clear()
{
  for (int i = 0; i < 64; i++)
  {
    leds[i] = CRGB::Black;
  }
}




void singleDigit(int num, CRGB color)
{
  const uint8_t *digitChars = numberIndices[num];

  int size = 0;
  while (digitChars[size] != end_byte || size == 0)
  {
    int index = digitChars[size];
    leds[index] = color;
    size++;
  }
  FastLED.show();
}

void bitBlock(int ten1, CRGB color, int offset)
{

  if (ten1 > 0)
  {
    leds[4 + offset] = color;
  }
  if (ten1 > 1)
  {
    leds[12 + offset] = color;
  }
  if (ten1 > 2)
  {
    leds[20 + offset] = color;
  }
  if (ten1 > 3)
  {
    leds[28 + offset] = color;
  }
  if (ten1 > 4)
  {
    leds[36 + offset] = color;
  }
  if (ten1 > 5)
  {
    leds[3 + offset] = color;
  }
  if (ten1 > 6)
  {
    leds[11 + offset] = color;
  }
  if (ten1 > 7)
  {
    leds[19 + offset] = color;
  }
  if (ten1 > 8)
  {
    leds[27 + offset] = color;
  }
  if (ten1 > 9)
  {
    leds[35 + offset] = color;
  }
}

void bitColumn(int ten1, CRGB color)
{
  int offset = 0;
  if (ten1 > 0)
  {
    leds[52 + offset] = color;
  }
  if (ten1 > 1)
  {
    leds[60 + offset] = color;
  }
  if (ten1 > 2)
  {
    leds[51 + offset] = color;
  }
  if (ten1 > 3)
  {
    leds[59 + offset] = color;
  }
  if (ten1 > 4)
  {
    leds[50 + offset] = color;
  }
  if (ten1 > 5)
  {
    leds[58 + offset] = color;
  }
  if (ten1 > 6)
  {
    leds[49 + offset] = color;
  }
  if (ten1 > 7)
  {
    leds[57 + offset] = color;
  }
  if (ten1 > 8)
  {
    leds[48 + offset] = color;
  }
  if (ten1 > 9)
  {
    leds[56 + offset] = color;
  }
}

void setBitBlock(int multiplikator, int ten1, int ten2, int ten3, int ten4, CRGB color)
{
  clear();

  bitBlock(ten1, color, -3);
  bitBlock(ten2, color, 0);
  bitBlock(ten3, color, 3);

  bitColumn(ten4, color);
}

`

