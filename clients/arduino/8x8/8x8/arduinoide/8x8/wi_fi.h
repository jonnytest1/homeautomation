
#ifndef WIFI_INTERFACE_C
#define WIFI_INTERFACE_C

#include <string>
#include <functional>

struct WifiCallback
{
  std::function<void()> wifi_timeout;
};

void waitForWifi();
std::string getDeviceIp();
WifiCallback wifi_cb_ref();

#endif