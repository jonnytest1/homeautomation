
#include <map>
#include <Arduino.h>
#include <HTTPClient.h>

void request(const String url, const std::map<String, String> data, void (*callback)(int httpCode, String response), boolean b64);

class HttpServer
{
public:
    void step();
    HttpServer(int port, String (*callback)(String header, WiFiClient client));
    void begin();

private:
    WiFiServer wifiServer;
    // Current time
    unsigned long currentTime = millis();
    // Previous time
    unsigned long previousTime = 0;
    // Define timeout time in milliseconds (example: 2000ms = 2s)
    const long timeoutTime = 2000;
    String (*requestHandle)(String header, WiFiClient client);

    void processRequest();
    void parseRequest(WiFiClient client);
};