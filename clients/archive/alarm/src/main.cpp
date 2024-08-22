#include <Arduino.h>
#include "lib/uuid.h"
#include "lib/encoding.h"
#include "lib/jsonnode.h"
#include "lib/http.h"
#include "lib/prop.h"
#include "lib/http_request.h"
#include "lib/log.h"
#include "lib/str.h"
#include "lib/wi_fi.h"
#include "lib/smarthome.h"
#include "ArduinoOTA.h"

#define PORT 80

int motorPin = 16;

void onAction(std::string action, SmartHome *smarthomeRef)
{
  if (action == "dismiss")
  {
    digitalWrite(motorPin, LOW);
    smarthomeRef->updateState(JsonFactory::FALSE());
  }
  else if (action == "enable")
  {
    setPinHighTimed(motorPin, 1000 * 10);
  }
}

std::string onRequest(HttpRequest *request)
{
  std::string response = "";
  // response += request->path;
  // response += request->body + "headers: " + json(request->headers) + " hraw:" + request->requestHeader;
  if (request->path.startsWith("/healthcheck"))
  {
    response = "ok";
  }
  else if (request->path.startsWith("/alarm"))
  {
    Serial.println("alarm");
    if (request->headers.count("content-type") == 1)
    {
      if (request->headers.at("content-type") == "application/json")
      {
        Serial.println("json");
        Serial.println(request->body);
        // response += "json";
        JsonNode jsonBody = parseJson(request->body);
        if (jsonBody.isObject)
        {
          JsonNode eventNode = jsonBody.objectContent.at("event");
          JsonNode nameNode = jsonBody.objectContent.at("value2");

          std::map<std::string, std::string> logDataMap = {
              {"application", getDeviceKey()},
              {"event", eventNode.textValue},
              {"alarm_time", jsonBody.objectContent.at("value1").textValue},
              {"alarm_name", nameNode.textValue}};

          logData("INFO", "alarm event", logDataMap);
          if (eventNode.isText && eventNode.textValue == "alarm_alert_start")
          {
            Serial.println("alrm start");
            response += "alarmstart\n";

            if (nameNode.isText && str_includes(nameNode.textValue, "motor"))
            {
              Serial.println("enable motor");
              response += "motor\n";
              setPinHighTimed(motorPin, 1000 * 10);
            }
          }
        }
      }
    }
  }
  else if (request->path.startsWith("/close"))
  {
    digitalWrite(motorPin, LOW);
    response = "closed";
  }
  else
  {
    response += request->body.c_str();
    response += " hraw:";
    response += request->requestHeader.c_str();
    request->sendHeader(501, response.length());
  }
  return response;
}

SmartHome smarthome(onAction);

JsonNode getReceiver()
{

  JsonNode actions = JsonFactory::list( //
      {                                 //
       JsonFactory::obj(                //
           {
               //
               {"name", JsonFactory::str("enable")},
               {"confirm", JsonFactory::TRUE()},
           }),
       JsonFactory::obj( //
           {
               //
               {"name", JsonFactory::str("dismiss")},
           })

      });
  return JsonFactory::obj({
      {"name", JsonFactory::str("alarm motor")},
      {"state", JsonFactory::str("boolean")},
      {"description", JsonFactory::str("motor for to rattle the bed until i wake up")},
      {"actions", actions} //
  });
}

void setup()
{
  Serial.begin(115200);
  Serial.println("start");

  pinMode(motorPin, OUTPUT);

  std::string otaPassword = generateUuid();
  Serial.println("ota password: " + String(otaPassword.c_str()));
  smarthome.fallbackRequestHandler = onRequest;
  smarthome.getReceiverConfig = getReceiver;
  smarthome.init();

  logData("INFO", "startup log", {{"otaPassword", otaPassword}, {"ip", getDeviceIp()}});

  ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
  ArduinoOTA.setPassword(otaPassword.c_str());
  ArduinoOTA.begin();
  Serial.println("v1");
}

void loop()
{
  smarthome.step();
  ArduinoOTA.handle();
}