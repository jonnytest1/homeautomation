#define CORE_DEBUG_LEVEL ARDUHAL_LOG_LEVEL_VERBOSE
#define CONFIG_COMPILER_CXX_EXCEPTIONS
// #define WIFI_Kit_32

#include <Arduino.h>
#include <INA226_WE.h>

#include <exception>

#include "ArduinoOTA.h"
#include "creds.h"
#include "esp_debug_helpers.h"
#include "i2c.h"
#include "lib/log.h"
#include "lib/prop.h"
#include "lib/restart.h"
#include "lib/smarthome.h"
#include "lib/str.h"
#include "lib/uuid.h"
#include "lib/wi_fi.h"
#include "pwr/allpowers-ble-client.cpp"
#include "pwr/battery.h"
#include "pwr/solar-control.h"
#include "reference.h"
#include "relay/relayboard.h"
#include "screen.cpp"
#include "timesetup.cpp"

// #include "test_stuff.h"

void onAction(std::string actionName, SmartHome *sm)
{
}
ThreeWire I2C_2 = ThreeWire(1);
SmartHome smarthome(onAction);

Screen screen;

AllpowersBleClient allpowersBleClient(mac_addressR600, &screen);
Reference<AllpowersBleData> r600DataRef;

unsigned long lastUpdate = 0;
long inPower0Since = 0;
long inPower0LastReset = 0;

RelayBoard16 board16 = RelayBoard16(0x20, &I2C_2);

RelayBoardIndex *landline = board16.forIndex(8);

INA226Ref solarIn = INA226Ref(&I2C_2, 0x40, &screen);

INA226Ref batteryIna266 = INA226Ref(&I2C_2, 0x41, &screen);

int resetFrequency = 1000 * 60 * 5;
int min0ForGh = 1000 * 60 * 60 * 6;

// pins
// https://excalidraw/_https://excalidraw/?file=power&element=72tbTR_-LwVMT9EohzrCS
RelayBoardIndex *solarLine = board16.forIndex(13)->withDefaultOn();

SolarControl solarControl(
    {
        {board16.forIndex(7), board16.forIndex(6)}, //
        //{board16.forIndex(5), board16.forIndex(4)}, //
        // {board16.forIndex(3), board16.forIndex(2)}, //
        {board16.forIndex(1), board16.forIndex(0)} //
    },
    solarLine, landline, &smarthome, &screen);

int minLandlineOfftime = 1000 * 60;

int remainingMinutes = -1;
long remainingMinutesSince = 0;

String checkReset(int inPower)
{
    long now = millis();
    long lastOffAgo = (now - landline->lastOffTimestamp);

    if (landline->currentState || lastOffAgo < minLandlineOfftime)
    {
        return String("lline ") + (floor(lastOffAgo / 1000));
    }

    if (inPower == 0)
    {
        if (inPower0Since == 0)
        {
            inPower0Since = now;
        }
        long timeSincePower0 = now - inPower0Since;
        if (timeSincePower0 < min0ForGh)
        {
            return String("min ") + itos((min0ForGh - timeSincePower0) / (1000 * 60)).c_str();
        }

        struct tm timeinfo;
        if (!getLocalTime(&timeinfo))
        {
            ESP_LOGI(L_TAG, "Failed to obtain time 1");
            return "err";
        }
        if (timeinfo.tm_hour >= 5 && timeinfo.tm_hour < 16)
        {
            ESP_LOGI(L_TAG, "got time fit");

            int timeSinceLastReset = now - inPower0LastReset;

            if (timeSinceLastReset > resetFrequency)
            {
                inPower0LastReset = now;
                solarControl.resetSolar();
                return "true";
            }

            return String("frq ") + itos((resetFrequency - timeSinceLastReset) / (1000 * 60)).c_str() + " /5";
        }
        return "t";
    }
    else
    {
        inPower0Since = 0;
        return "-";
    }
}

void command1(AllpowersBleData *r600Data)
{
    r600DataRef.update(r600Data);

    smarthome.next([]() {
        ESP_LOGI(L_TAG, "sending event cmd1");

        if (r600DataRef.ref->acOpen == 0 || r600DataRef.ref->dcOpen == 0)
        {
            // allpowersBleClient.enablePower();
        }

        String updateText = itos(r600DataRef.ref->inPower).c_str() + String(" in");

        ESP_LOGI(L_TAG, "%s", updateText.c_str());
        int remainingMins = r600DataRef.ref->remainingMins;
        if (remainingMins != remainingMinutes)
        {
            remainingMinutes = remainingMins;
            remainingMinutesSince = millis();
        }

        if (remainingMinutesSince != 0)
        {
            int millisSince = millis() - remainingMinutesSince;

            remainingMins = remainingMinutes - floor(millisSince / (1000 * 60));
        }

        screen.statusLine2 = itos(remainingMins).c_str() + String(" rem");

        updateText += " " + checkReset(r600DataRef.ref->inPower);
        screen.updateStatus(updateText);

        if (lastUpdate + 30000 > millis())
        {
            return;
        }
        lastUpdate = millis();

        solarControl.updateChargeMode(r600DataRef.ref->currentChargePercent);

        smarthome.triggerSenderEvent(
            "command1", JsonFactory::obj({{"powerAmount", JsonFactory::num(r600DataRef.ref->currentChargePercent)},
                                          {"inPower", JsonFactory::num(r600DataRef.ref->inPower)},
                                          {"outPower", JsonFactory::num(r600DataRef.ref->outPower)},
                                          {"remainingMinutes", JsonFactory::num(remainingMins)},
                                          {"dcOpen", JsonFactory::num(r600DataRef.ref->dcOpen)},
                                          {"acOpen", JsonFactory::num(r600DataRef.ref->acOpen)},
                                          {"is60Hz", JsonFactory::num(r600DataRef.ref->is60Hz)},
                                          {"beepOpen", JsonFactory::num(r600DataRef.ref->beepOpen)},
                                          {"ledOpen", JsonFactory::num(r600DataRef.ref->ledOpen)},
                                          {"screenOpen", JsonFactory::num(r600DataRef.ref->screenOpen)},
                                          {"voiceOpen", JsonFactory::num(r600DataRef.ref->voiceOpen)},
                                          {"landlineState", JsonFactory::num(landline->currentState ? 100 : 0)},
                                          {"solarCurrentmA", JsonFactory::num(solarIn.lastCurrentmA)},
                                          {"solarVoltagemV", JsonFactory::num(solarIn.voltage_mV())},
                                          {"batteryVoltagemV", JsonFactory::num(batteryIna266.voltage_mV())},
                                          {"inPower0Since", JsonFactory::num(inPower0Since)}}));
    });
}

JsonNode getSenderConfig()
{
    JsonNode cmd1Schema = JsonFactory::obj({
        {"type", JsonFactory::str("object")},
    });
    JsonNode cmd2Schema = JsonFactory::obj({
        {"type", JsonFactory::str("object")},
    });
    JsonNode events = JsonFactory::list( //
        {                                //
         JsonFactory::obj(               //
             {
                 //
                 {"name", JsonFactory::str("command1")},
                 {"schema", cmd1Schema},

             }),
         JsonFactory::obj( //
             {
                 //
                 {"name", JsonFactory::str("command2")},
                 {"schema", cmd2Schema},
             })});

    return JsonFactory::obj({
        {"name", JsonFactory::str("solar battery")},
        {"description", JsonFactory::str("monitors and controls solar battery")},
        {"events", events},
    });
}

void setup()
{
    // give some initial time in case the last screen message was important
    delay(1000);

    // v x x x x x v
    screen.VextON();
    screen.init();

    Serial.begin(115200);
    Serial.setDebugOutput(true);
    ESP_LOGI(L_TAG, "start");
    delay(500);
    screen.showStatus("waiting wifi ...");
    waitForWifi();
    delay(100);

    initTime();
    printLocalTime();
    screen.showStatus("got wifi");

    ArduinoOTA.onStart([]() { screen.showStatus("OTA flashing ..."); });

    ArduinoOTA.onProgress([](int progress, int total) {
        String prog = itos((progress / (total / 100))).c_str();
        screen.showStatus("OTA flashing ..." + prog);
    });
    screen.updateStatus("smarthome init ...");
    screen.printScreen();
    smarthome.getSenderConfig = getSenderConfig;
    smarthome.init();
    smarthome.ota();
    ESP_LOGI(L_TAG, "Free heap after ota: %d", esp_get_free_heap_size());

    smarthome.next(
        []() {
            screen.updateStatus("restart log ...");
            screen.printScreen();
            logRestartReason();
            smarthome.next(
                []() {
                    ESP_LOGI(L_TAG, "Free heap after restart log: %d", esp_get_free_heap_size());

                    screen.updateStatus("i2c setup ...");
                    screen.printScreen();
                    // ThreeWire::listI2c(I2C_2);
                    delay(100);
                    if (!I2C_2.begin(48, 47))
                    {
                        ESP_LOGE(L_TAG, "couldnt begin i2c");
                        logData("ERROR", "failed begin i2c", {});
                        assert(false);
                    }
                    I2C_2.setTimeout(50);
                    delay(100);
                    ESP_LOGI(L_TAG, "Free heap after i2c begin: %d", esp_get_free_heap_size());
                    ESP_LOGI(L_TAG, "board begin");
                    board16.begin();
                    solarLine->_on();
                    landline->_off();
                    ESP_LOGI(L_TAG, "Free heap after relay init: %d", esp_get_free_heap_size());
                    solarControl.resetSolar();
                    ESP_LOGI(L_TAG, "Free heap after resetSolar: %d", esp_get_free_heap_size());
                    landline->onchange = [](boolean newState) {
                        ESP_LOGI(L_TAG, "landline change");
                        std::string message = newState ? "landline on" : "landline off";

                        smarthome.next([message]() { //
                            logData("WARN", message, {{"inPower0Since", itos(inPower0Since)}});
                        });
                    };
                    landline->onchange(false);

                    ESP_LOGI(L_TAG, "setting i2c error handler");
                    I2C_2.onerror = [](String error, int attempts) {
                        smarthome.next([error, attempts]() { //
                            ESP_LOGE(L_TAG, "I2C_2 onerror");
                            logData("ERROR", "error in i2c transmission",
                                    {{"i2c_error", error.c_str()}, {"attempts", itos(attempts)}});
                        });
                    };

                    screen.showStatus("setup solar in ...");
                    if (!solarIn.initialize())
                    {
                        ESP_LOGE(L_TAG, "INA226 not detected!");
                        logData("ERROR", "INA226 not detected!", {});
                        assert(false);
                    }

                    screen.showStatus("setup battery ina266 ...");
                    if (!batteryIna266.initialize())
                    {
                        ESP_LOGE(L_TAG, "INA226 not detected!");
                        logData("ERROR", "batteryIna266 not detected!", {});
                        assert(false);
                    }
                    ESP_LOGI(L_TAG, "Free heap after ina266 init: %d", esp_get_free_heap_size());

                    screen.showStatus("ble init ....");
                    allpowersBleClient.init(command1);
                    logData("INFO", "finished setup", {});
                },
                1000);
        },
        1000);
}
uint32_t previousFreeHeap = 0;

void loop()
{
    uint32_t newFreeHeap = esp_get_free_heap_size();
    if (newFreeHeap != previousFreeHeap)
    {
        ESP_LOGW(L_TAG, "Free heap loop start: %d", newFreeHeap);
        previousFreeHeap = newFreeHeap;
    }

    if (solarIn.initialized && smarthome.stepCt % 50 == 0)
    {

        solarIn.fetchVoltage();
        solarIn.fetchCurrent();

        screen.statusLine3 =
            String(itos(solarIn.lastCurrentmA).c_str()) + "mA ~" + itos(solarIn.lastVoltage).c_str() + "V";
    }

    if (batteryIna266.initialized)
    {
        batteryIna266.fetchVoltage();
    }

    smarthome.step();

    allpowersBleClient.step();

    screen.printScreen();
}