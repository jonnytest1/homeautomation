export const propsContent = `
#include "creds.h"
#include <string>

std::string serverEndpoint()
{
    return serverHost;
}
std::string logEndpoint()
{
    return logHost;
}
std::string getDeviceKey()
{
    return deviceKey;
}

std::string getWlanSSID()
{
    return ssid;
}
std::string getWlanPWD()
{
    return password;
}`