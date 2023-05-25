#include <Arduino.h>
#include <map>
#include "lib/uuid.h"
#include "lib/encoding.h"
#include "lib/http.h"
#include "lib/http_request.h"
#include "lib/http_client.h"
#include "lib/log.h"
#include "lib/prop.h"
#include "lib/str.h"
#include "lib/wi_fi.h"
#include "lib/smarthome.h"
#include "ArduinoOTA.h"

int valvePin = 16;

void onAction(std::string actionName, SmartHome *sm)
{

    if (actionName == "refill")
    {
        setPinHighTimed(valvePin, 1000 * 8.5);
        // sm->updateState(JsonFactory::TRUE());
    }
    else if (actionName == "stop")
    {
        digitalWrite(valvePin, LOW);
        // sm->updateState(JsonFactory::FALSE());
    }
}

SmartHome smarthome(onAction);

std::string onRequest(HttpRequest *request)
{
    std::string response = "";
    if (request->path.startsWith("/healthcheck"))
    {
        request->responseStatus = 200;
        response = "ok";
    }
    else if (request->path.startsWith("/open"))
    {
        setPinHighTimed(valvePin, 1000 * 9);
        smarthome.updateState(JsonFactory::TRUE());
        request->responseStatus = 200;
        response = "opened ";
    }
    else if (request->path.startsWith("/close"))
    {
        digitalWrite(valvePin, LOW);
        smarthome.updateState(JsonFactory::FALSE());
        request->responseStatus = 200;
        response = "closed";
    }
    else
    {
        request->sendHeader(501, response.length());
    }
    return response;
}

JsonNode getReceiver()
{

    JsonNode actions = JsonFactory::list( //
        {                                 //
         JsonFactory::obj(                //
             {
                 //
                 {"name", JsonFactory::str("refill")},
                 {"confirm", JsonFactory::TRUE()},
             }),
         JsonFactory::obj( //
             {
                 //
                 {"name", JsonFactory::str("stop")},
             })

        });
    return JsonFactory::obj({
        {"name", JsonFactory::str("water supply")},
        {"state", JsonFactory::str("boolean")},
        {"description", JsonFactory::str("refill water")},
        {"actions", actions} //
    });
}

void setup()
{
    Serial.begin(115200);
    Serial.println("start");

    pinMode(valvePin, OUTPUT);
    digitalWrite(valvePin, LOW);
    std::string otaPassword = "7kg8s02n-ixy07d7k-sww9za8x-pdv36fj7"; // generateUuid();

    Serial.println(("ota password: " + otaPassword).c_str());

    smarthome.fallbackRequestHandler = onRequest;
    smarthome.getReceiverConfig = getReceiver;

    smarthome.init();

    // put your setup code here, to run once:
    ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
    ArduinoOTA.setPassword(otaPassword.c_str());
    ArduinoOTA.begin();
    logData("INFO", "startup log", {{"otaPassword", otaPassword}});
}

void loop()
{
    smarthome.step();
    ArduinoOTA.handle();
}