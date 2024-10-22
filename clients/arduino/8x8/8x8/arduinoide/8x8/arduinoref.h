
#ifndef MOCK_ARDUINO
#include <Arduino.h>
#endif

#ifdef MOCK_ARDUINO

#ifndef MOCKSTRING
#define MOCKSTRING
#include <mock-string.h>
#endif

#ifndef MOCKSERIAL
#define MOCKSERIAL
#include <mock-serial.h>
#endif

#endif