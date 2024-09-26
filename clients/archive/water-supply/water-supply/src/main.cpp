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
#include "lib/restart.h"
#include "ArduinoOTA.h"
#include "lib/jsonnode.h"

int valvePin = 16;
int fillDuration = 7;

void onRefill(SmartHome *sm)
{
  Serial.println("matched refill");
  setPinHighTimed(
      valvePin, 1000 * fillDuration, [sm]()
      { sm->updateState(JsonFactory::FALSE()); });
  sm->next([sm]()
           { sm->updateState(JsonFactory::TRUE()); });
}

void onAction(std::string actionName, SmartHome *sm)
{

  if (actionName == "refill")
  {
    onRefill(sm);
  }
  else if (actionName == "stop")
  {
    digitalWrite(valvePin, LOW);
    sm->updateState(JsonFactory::FALSE());
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
    onRefill(&smarthome);
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
               {"icon", JsonFactory::str("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMjMuMS4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTIwMCAxMjAwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxMjAwIDEyMDA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj48c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtmaWxsOiMyRjM3NEI7fQo8L3N0eWxlPjxnPjxnPjxnPjxnPjxnPjxnPjxjaXJjbGUgY2xhc3M9InN0MCIgY3g9Ijk0Mi42IiBjeT0iMTA3NC40OSIgcj0iMjMuMzYiLz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iODU5LjU1IiBjeT0iMTA3NC40OSIgcj0iMjAuNzYiLz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iODU5LjU1IiBjeT0iOTEwLjMzIiByPSIyMC43NiIvPjwvZz48L2c+PC9nPjwvZz48Zz48Zz48Zz48Zz48Y2lyY2xlIGNsYXNzPSJzdDAiIGN4PSI3NzYuNSIgY3k9IjEwNzQuNDkiIHI9IjIwLjc2Ii8+PC9nPjwvZz48L2c+PC9nPjxnPjxnPjxnPjxnPjxjaXJjbGUgY2xhc3M9InN0MCIgY3g9IjkwMi4zNyIgY3k9Ijk5MS40MyIgcj0iMjAuNzYiLz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iODE5LjMyIiBjeT0iOTkxLjQzIiByPSIyMC43NiIvPjwvZz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PGc+PGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iMTAyNS43OSIgY3k9IjEwNzQuNDkiIHI9IjIzLjM2Ii8+PC9nPjwvZz48L2c+PC9nPjxnPjxnPjxnPjxnPjxjaXJjbGUgY2xhc3M9InN0MCIgY3g9Ijk0Mi43NCIgY3k9IjkxMC4zMyIgcj0iMjAuNzYiLz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PGNpcmNsZSBjbGFzcz0ic3QwIiBjeD0iOTg1LjU2IiBjeT0iOTkxLjQzIiByPSIyMC43NiIvPjwvZz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PHBhdGggY2xhc3M9InN0MCIgZD0iTTk2OS44OCw4NDMuMTJoLTEzMS40Yy0zOS40MywwLTcxLjUxLTMyLjA4LTcxLjUxLTcxLjUxdi0xNy41MmMwLTI5Ljc5LDE4LjI1LTU1LjY0LDQ0LjY5LTY2LjMKCQkJCQkJYzAuODYtMTAuOTEtMS45NS0zOS41Ny00Mi42MS04MS45Mkg2MzIuNjdjLTMwLjk0LDM5LjQ5LTc3LjIsNjIuNzgtMTI1LjYxLDYyLjc4Yy00OC40LDAtOTQuNjYtMjMuMy0xMjUuNjEtNjIuNzhoLTIzMC42VjM4NAoJCQkJCQloMjMwLjZjMzAuOTUtMzkuNDksNzcuMjEtNjIuNzgsMTI1LjYxLTYyLjc4YzQ4LjQxLDAsOTQuNjcsMjMuMjksMTI1LjYxLDYyLjc4aDE0My4zNWMxMS4yMi0xLjI0LDc4LjIxLTYuMDgsMTM3LjY0LDQ1LjUKCQkJCQkJYzU5LjIxLDUxLjM4LDkwLjA0LDEzOS42NSw5MS43LDI2Mi40NWMyMi4wNCwxMi40OSwzNi4wMywzNS44OCwzNi4wMyw2Mi4xM3YxNy41MgoJCQkJCQlDMTA0MS4zOSw4MTEuMDQsMTAwOS4zMSw4NDMuMTIsOTY5Ljg4LDg0My4xMnogTTg0OS42NSw2ODkuMTNsNDkuOSwyNC4yNWwtNjQuOSw3LjMzYy0xNi45OCwxLjkyLTI5Ljc4LDE2LjI2LTI5Ljc4LDMzLjM3CgkJCQkJCXYxNy41MmMwLDE4LjUzLDE1LjA4LDMzLjYxLDMzLjYxLDMzLjYxaDEzMS40YzE4LjUzLDAsMzMuNjEtMTUuMDgsMzMuNjEtMzMuNjF2LTE3LjUyYzAtMTQuODgtOS41Ni0yNy43OS0yMy43Ny0zMi4xNAoJCQkJCQlsLTI4LjYxLTguNzVsMTYuMzktMTguMDFjLTEuMDgtMTEyLjk1LTI3LjUzLTE5Mi42OS03OC42Ny0yMzcuMDZjLTUwLjgyLTQ0LjEtMTA4LjQzLTM2LjUtMTA4Ljk5LTM2LjQxbC0yLjY3LDAuMTlINjEzLjE3CgkJCQkJCWwtNS42NS04LjE2Yy0yNC4wNC0zNC43MS02MC42Ni01NC42Mi0xMDAuNDctNTQuNjJjLTM5LjgxLDAtNzYuNDMsMTkuOTEtMTAwLjQ3LDU0LjYybC01LjY1LDguMTZIMTg4Ljc1djE0Ni4wNmgyMTIuMTkKCQkJCQkJbDUuNjUsOC4xNmMyNC4wNCwzNC43MSw2MC42Nyw1NC42MiwxMDAuNDcsNTQuNjJjMzkuODEsMCw3Ni40My0xOS45MSwxMDAuNDctNTQuNjJsNS42NS04LjE2aDE4Mi45NHYxMS4zNwoJCQkJCQlDODQ0LjA2LDYyOS4xNCw4NTAuOTgsNjY3LjY2LDg0OS42NSw2ODkuMTN6Ii8+PC9nPjwvZz48L2c+PC9nPjxnPjxnPjxnPjxnPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik01NTkuODcsMzAzLjQyaC0zNy45VjE2NS4zOGMwLTEzLjk3LTExLjM2LTI1LjMzLTI1LjMyLTI1LjMzcy0yNS4zMiwxMS4zNi0yNS4zMiwyNS4zM3YxMzguMDNoLTM3LjkKCQkJCQkJVjE2NS4zOGMwLTM0Ljg3LDI4LjM2LTYzLjIzLDYzLjIzLTYzLjIzczYzLjIzLDI4LjM2LDYzLjIzLDYzLjIzVjMwMy40MnoiLz48L2c+PC9nPjwvZz48L2c+PGc+PGc+PGc+PGc+PHBhdGggY2xhc3M9InN0MCIgZD0iTTQ0NS44NiwyNjEuMTZIMjg3LjYzYy0zMC4xOSwwLTU0Ljc2LTI0LjU3LTU0Ljc2LTU0Ljc2czI0LjU3LTU0Ljc2LDU0Ljc2LTU0Ljc2aDE2Ni4wM3YzNy45SDI4Ny42MwoJCQkJCQljLTkuMywwLTE2Ljg2LDcuNTYtMTYuODYsMTYuODZzNy41NiwxNi44NiwxNi44NiwxNi44NmgxNTguMjJWMjYxLjE2eiIvPjwvZz48L2c+PC9nPjwvZz48Zz48Zz48Zz48Zz48cGF0aCBjbGFzcz0ic3QwIiBkPSJNNzAzLjA0LDI2MS4xNkg1NDQuODJ2LTM3LjloMTU4LjIyYzkuMywwLDE2Ljg2LTcuNTYsMTYuODYtMTYuODZzLTcuNTYtMTYuODYtMTYuODYtMTYuODZINTM3LjAxdi0zNy45CgkJCQkJCWgxNjYuMDNjMzAuMTksMCw1NC43NiwyNC41Niw1NC43Niw1NC43NlM3MzMuMjMsMjYxLjE2LDcwMy4wNCwyNjEuMTZ6Ii8+PC9nPjwvZz48L2c+PC9nPjwvZz48L3N2Zz4K")},
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
  wifi_cb_ref().wifi_timeout = []()
  { digitalWrite(valvePin, LOW); };

  Serial.begin(115200);
  Serial.println("start");

  pinMode(valvePin, OUTPUT);
  digitalWrite(valvePin, LOW);
  std::string otaPassword = generateUuid();

  Serial.println(("ota password: " + otaPassword).c_str());

  smarthome.fallbackRequestHandler = onRequest;
  smarthome.getReceiverConfig = getReceiver;

  smarthome.init();

  smarthome.next([]()
                 { smarthome.registerAction("refill", onRefill); });
  // initially setting to off
  smarthome.next([]()
                 { smarthome.updateState(JsonFactory::FALSE()); });
  // put your setup code here, to run once:
  ArduinoOTA.setHostname(("esp32-" + getDeviceKey() + "_ota").c_str());
  ArduinoOTA.setPassword(otaPassword.c_str());
  ArduinoOTA.begin();
  logData("INFO", "startup log", {{"otaPassword", otaPassword}});
  logRestartReason();
}

void loop()
{
  smarthome.step();
  ArduinoOTA.handle();
}