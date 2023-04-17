
#ifndef CSTM_HTTP_REQUEST
#define CSTM_HTTP_REQUEST
#include <map>
#include <HTTPClient.h>

class HttpRequest
{
public:
    HttpRequest(String header, WiFiClient client, String (*callback)(HttpRequest *client));

    void sendHeader(int status, int size);
    String method;
    String path;
    std::map<String, String> headers = {};
    String requestHeader;
    String body;

private:
    WiFiClient wifiClient;
    String (*requestHandle)(HttpRequest *client);

    bool hasSentHeader;

    void handleRequest();
    void parseRequestHeader();
    void parseRequestBody();
    void parseHttpHeader(String header);
};

#endif