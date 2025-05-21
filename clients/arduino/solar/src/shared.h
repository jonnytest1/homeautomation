#ifndef statusupdaterref
#define statusupdaterref

#include <Arduino.h>

class StatusUpdater
{
public:
  virtual void updateStatus(String) = 0;
};

#endif