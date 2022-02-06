#include "http.h"
#include <map>

void logData(String logLevel, String message, const std::map<String, String> data)
{
    std::map<String, String> reqestData(data);

    reqestData.insert(std::pair<String, String>("message", message));
    reqestData.insert(std::pair<String, String>("Severity", logLevel));

    request(logEndpoint() + "/tm/libs/log/index.php", reqestData, NULL, true);
}