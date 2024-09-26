#include <unity.h>
#include "uuid.h"
#include <Arduino.h>

void setup()
{
    UNITY_BEGIN();

    for (int i = 0; i < 100; i++)
    {
        String uuiid = generateUuid();
    }

    UNITY_END();
}