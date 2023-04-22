#include "http_request.h"
#include "str.h"
#include <map>

HttpRequest::HttpRequest(String header, WiFiClient *client, String (*callback)(HttpRequest *client))
{
    wifiClient = client;
    requestHandle = callback;
    requestHeader = header;
    hasSentHeader = false;
    Serial.println(header); // as
    parseRequestHeader();
    parseRequestBody();
    handleRequest();
}
void HttpRequest::parseHttpHeader(String headerLine)
{

    int pIndex = 0;
    for (auto part : string_split(headerLine, " "))
    {
        if (pIndex == 0)
        {
            method = part;
        }
        else if (pIndex == 1)
        {
            path = part;
        }
        pIndex++;
    }
}
void HttpRequest::parseRequestHeader()
{

    int index = 0;

    String delim = "\r\n";

    if (requestHeader.indexOf(delim) == -1)
    {
        delim = "\n";
    }

    for (auto line : string_split(requestHeader.c_str(), delim))
    {
        if (index == 0)
        {
            parseHttpHeader(line);
        }
        else
        {
            String key;
            String value;
            int pIndex = 0;
            for (auto part : string_split(line, ": "))
            {
                if (pIndex == 0)
                {
                    part.toLowerCase();
                    key = part;
                }
                else if (pIndex == 1)
                {
                    value = part;
                }
                pIndex++;
            }
            headers.insert(std::pair<String, String>(key, value));
        }
        index++;
    }
}
void HttpRequest::parseRequestBody()
{
    int contentSize = -1;
    headers.find("content-length");
    if (headers.count("content-length") == 1)
    {
        String contentSizeHeader = headers.at("content-length");
        contentSize = stoi(contentSizeHeader);
    }

    int ct = 0;
    body = "";
    while (wifiClient->connected() && ct < contentSize)
    { // loop while the client's connected
        if (wifiClient->available())
        {
            char c = wifiClient->read();
            body += c;
            ct++;
        }
        else
        {
            break;
        }
    }
}
void HttpRequest::handleRequest()
{

    // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
    // and a content-type so the client knows what's coming, then a blank line:

    String responseBody = requestHandle(this);
    if (asyncSend)
    {
        return;
    }
    sleep(0.1);
    sendResponse(responseBody);
    sleep(0.1);
    wifiClient->stop();
}

void HttpRequest::sendResponse(String body)
{
    sendHeader(responseStatus, body.length());
    wifiClient->println(body);
    wifiClient->println();
    wifiClient->println();
}

void HttpRequest::sendHeader(int status, int size)
{
    if (hasSentHeader)
    {
        return;
    }
    hasSentHeader = true;

    wifiClient->println("HTTP/1.1 " + String(status));
    wifiClient->println("Content-Length: " + String(size));
    wifiClient->println("Content-type:application/json");
    for (std::map<std::string, std::string>::iterator it = responseHeaders.begin(); it != responseHeaders.end(); ++it)
    {
        wifiClient->print(it->first.c_str());
        wifiClient->print(": ");
        wifiClient->println(it->second.c_str());
    }
    wifiClient->println("Connection: close");
    wifiClient->println();
}