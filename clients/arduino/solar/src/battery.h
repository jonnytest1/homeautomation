#include <vector>
#include <Arduino.h>
struct VoltageSOC
{
  float voltage; // Voltage in volts
  int soc;       // State of charge in percent
};
// Lookup table for 12V LiFePO4 battery (4S) at rest
const std::vector<VoltageSOC> lifepo4SOC12V = {
    {13.6, 100},
    {13.4, 100},
    {13.3, 90},
    {13.2, 80},
    {13.1, 70},
    {13.0, 60},
    {12.9, 50},
    {12.8, 40},
    {12.7, 30},
    {12.6, 20},
    {12.5, 10},
    {12.0, 0}};

class Battery
{
private:
  const std::vector<VoltageSOC> lifepo4SOC;
  float capacityAh;

public:
  Battery(const std::vector<VoltageSOC> lifepo4SOC, float capacityAh) : lifepo4SOC(lifepo4SOC), capacityAh(capacityAh)
  {
  }

  float estimateSOC(float voltage)
  {

    for (int i = 0; i < lifepo4SOC.size() - 1; ++i)
    {
      if (voltage >= lifepo4SOC[i + 1].voltage && voltage <= lifepo4SOC[i].voltage)
      {
        float v1 = lifepo4SOC[i].voltage;
        float v2 = lifepo4SOC[i + 1].voltage;
        int soc1 = lifepo4SOC[i].soc;
        int soc2 = lifepo4SOC[i + 1].soc;

        // Linear interpolation
        return soc1 + (voltage - v1) * (soc2 - soc1) / (v2 - v1);
      }
    }

    // Outside the range
    if (voltage >= lifepo4SOC.front().voltage)
      return 100;
    if (voltage <= lifepo4SOC.back().voltage)
      return 0;

    return -1; // Should never reach here
  }

  float estimateRemainingTime(float socPercent, float loadA)
  {
    if (loadA <= 0)
      return -1; // invalid load current

    return (capacityAh * socPercent) / (100.0f * loadA);
  }
};