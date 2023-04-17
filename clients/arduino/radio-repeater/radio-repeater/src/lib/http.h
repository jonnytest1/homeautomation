
#include <map>
#include "arduino-ref.h"
#include <HTTPClient.h>
#include "http_request.h"

void request(const String url, const std::map<String, String> data, void (*callback)(int httpCode, String response), boolean b64);
String serverEndpoint();
String logEndpoint();
String getDeviceKey();
class HttpServer
{
public:
    void step();
    HttpServer(int port, String (*callback)(HttpRequest *client));
    void begin();
    String getIp();

private:
    WiFiServer wifiServer;
    // Current time
    unsigned long currentTime = millis();
    // Previous time
    unsigned long previousTime = 0;
    // Define timeout time in milliseconds (example: 2000ms = 2s)
    const long timeoutTime = 2000;
    String (*requestHandle)(HttpRequest *client);

    void processRequest();
    void parseRequest(WiFiClient client);
};