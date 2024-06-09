#include <Arduino.h>
#include <HTTPClient.h>
#include "lib/http.h"
#include "lib/log.h"
#include "lib/uuid.h"
#include "lib/prop.h"
#include "lib/str.h"
#include "lib/jsonnode.h"
#include "lib/http_client.h"
#include "lib/wi_fi.h"
#include "ArduinoOTA.h"

int pinState = LOW;
#define PORT 80

int lampOn = LOW;
int lampOff = HIGH;

bool receiverCreate = false;
void triggerHandler(HttpClientRequest *request, int code, std::string data)
{
  Serial.println("triggerh");
  if (code != HTTP_CODE_OK && code != 409)
  {
    Serial.println(data.c_str());
    logData("ERROR", "error in request", {{"application", getDeviceKey().c_str()}, {"code", String(code).c_str()}, {"error", data.c_str()}});
  }
}
String onRequest(HttpRequest *client)
{

  Serial.println("request");
  if (client->path.indexOf("action") > -1)
  {
    Serial.println(client->body);
    JsonNode body = parseJson(client->body);
    Serial.println("parsing done");
    JsonNode name = body.objectContent.at("name");

    Serial.println("got name");
    if (name.textValue == "on")
    {
      Serial.println("on");
      digitalWrite(12, lampOn);
      pinState = lampOn;
    }
    else if (name.textValue == "off")
    {
      Serial.println("off");
      digitalWrite(12, lampOff);
      pinState = lampOff;
    }

    HttpClientRequest request(serverEndpoint() + "/nodets/rest/receiver/state");
    request.jsonBody(stringify(JsonFactory::obj({
        {"deviceKey", JsonFactory::str(getDeviceKey().c_str())},
        {"state", JsonFactory::str(pinState == lampOn ? "true" : "false")},
    })));
    request.callback = triggerHandler;
    request.send();

    return "currently " +
           String(pinState);
  }
  else
  {
    pinState = pinState == LOW ? HIGH : LOW;
    digitalWrite(12, pinState);

    return "currently " + String(pinState);
  }
}
HttpServer server(PORT, onRequest);

void setup()
{

  delay(1000);
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial.println("start");
  pinMode(12, OUTPUT);
  digitalWrite(12, pinState);

  std::string otaPassword = generateUuid();
  Serial.println(otaPassword.c_str());

  server.begin();

  Serial.println("");
  Serial.println("IP address: ");
  Serial.println(getDeviceIp().c_str());

  ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
  ArduinoOTA.setPassword(otaPassword.c_str());
  ArduinoOTA.begin();
  Serial.println("ota set up");
  logData("INFO", "startup log", {
                                     {"application", getDeviceKey().c_str()}, //
                                     {"otaPassword", otaPassword},
                                     {"ip", getDeviceIp().c_str()},
                                 });
  Serial.println("logged v1");
}

void registerReceiver()
{
  Serial.println("registering receiver");
  JsonNode actions = JsonFactory::list( //
      {                                 //
       JsonFactory::obj(                //
           {
               //
               {"name", JsonFactory::str("off")},
           }),
       JsonFactory::obj( //
           {
               //
               {"name", JsonFactory::str("on")},
           })

      });
  JsonNode data = JsonFactory::obj({
      {"deviceKey", JsonFactory::str(getDeviceKey().c_str())},
      {"port", String(PORT).c_str()},
      {"type", JsonFactory::str("http")},
      {"name", JsonFactory::str("lamp")},
      {"state", JsonFactory::str("boolean")},
      {"description", JsonFactory::str("toggle lamp on and off")},
      {"actions", actions} //
  });

  HttpClientRequest request(serverEndpoint() + "/nodets/rest/receiver");
  request.jsonBody(stringify(data));
  request.callback = triggerHandler;
  Serial.println("sending reuqest");
  request.send();
}

void loop()
{
  server.step();
  ArduinoOTA.handle();

  if (!receiverCreate)
  {
    registerReceiver();
    receiverCreate = true;
  }
}
