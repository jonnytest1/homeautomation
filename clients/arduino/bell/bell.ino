#include <HTTPClient.h>
#include <iostream>
#include <sstream>
#include <Arduino.h>
#include <WiFi.h>
#include <map>
#include "creds.h"

using namespace std::__cxx11;

#define VOLTAGE_PIN 35

String deviceKey = "bell-component";

void setup()
{
    Serial.begin(115200);
    //delay(100); //Take some time to open up the Serial Monitor
    pinMode(VOLTAGE_PIN, INPUT);
    switch (esp_sleep_get_wakeup_cause())
    {
    case ESP_SLEEP_WAKEUP_EXT0:
        Serial.println("Touch detected on GPIO 12");
        onBell();
        break;
    default:
        Serial.println("Wakeup not by touchpad");
        registerSender();
        break;
    }
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_12, 1);
    esp_deep_sleep_start();
}

void registerSender()
{
    request("https://192.168.178.54/nodets/rest/sender",
            {{
                "deviceKey",
                deviceKey.c_str(),
            }},
            triggerHandler,false);
}

void longPress()
{
}

void onBell()
{
    Serial.println("bellpress");
    String vol1 = getVoltage();
    delay(10);
    String vol2 = getVoltage();
    delay(10);
    String vol3 = getVoltage();
    
    request("https://192.168.178.54/nodets/rest/sender/trigger", {
      {"application", "component"}, 
      {"deviceKey",deviceKey},
      {"Severity", "INFO"}, 
      {"message", "bell"},
      {"a_read1", vol1}, 
      {"a_read2", vol2},
      {"a_read3", vol3}}, triggerHandler,false);
}

String getVoltage()
{
    int adcV = analogRead(VOLTAGE_PIN);
    String analodReadStr = String(adcV);
    //double voltage_value = (double)(adcV * 2 * 3.3 ) / (4095);
    //String volStr = dtoaFnc(voltage_value, 4);
    //return volStr;
    return analodReadStr.c_str();
}

void triggerHandler(int code, String data)
{
    if (code != HTTP_CODE_OK && code != 409 )
    {
        Serial.println(data);
        request("https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php", {
          {"application", deviceKey}, 
          {"Severity", "ERROR"}, 
          {"message", "error in request"} ,
          {"code", String(code) },
          {"error", data}
          }, NULL,true);
    }
}

void request(const String url, const std::map<String, String> data, void (*callback)(int httpCode, String response),boolean b64)
{
    WiFi.mode(WIFI_STA);
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(100);
        Serial.println("connecting ... ");
    }  
    HTTPClient httpf;
    httpf.begin(url);

    String requestData=json(data);
    if(b64){
      requestData=base64_encode(requestData);
    }else{
      httpf.addHeader("content-type","application/json");
    }
    Serial.println(requestData);
    int httpCodef = httpf.POST(requestData);
    if (httpCodef > 0)
    {
        Serial.printf("[HTTP] POST... code: %d\n", httpCodef);
        if (callback != NULL)
        {
            callback(httpCodef, httpf.getString());
        }
    }
    else
    {
        Serial.printf("[HTTP] GET... failed, error: %s\n", httpf.errorToString(httpCodef).c_str());
    }
    httpf.end();
}
void loop()
{
    /*onBell();
    delay(2000);*/
}

String json(const std::map<String, String> content)
{
    String out = "{";
    std::map<String, String>::const_iterator it = content.begin();
    bool separator = false;
    while (it != content.end())
    {
        if (separator)
        {
            out = out + ",";
        }
        else
        {
            separator = true;
        }
        out = out + "\"" + it->first + "\":\"" + it->second + "\" \n ";
        it++;
    }
    return out + "}";
}

void println(String data)
{
    Serial.println(data.c_str());
}

String base64_encode(const String &in)
{

    string out;

    int val = 0, valb = -6;
    for (char c : in)
    {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0)
        {
            out.push_back("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6)
        out.push_back("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[((val << 8) >> (valb + 8)) & 0x3F]);
    while (out.size() % 4)
        out.push_back('=');
    return out.c_str();
}

String dtoaFnc(double dN, int iP)
{
    char cVal[10];
    char *cMJA = cVal;
    char *ret = cMJA;
    long lP = 1;
    byte bW = iP;
    while (bW > 0)
    {
        lP = lP * 10;
        bW--;
    }
    long lL = long(dN);
    double dD = (dN - double(lL)) * double(lP);
    if (dN >= 0)
    {
        dD = (dD + 0.5);
    }
    else
    {
        dD = (dD - 0.5);
    }
    long lR = abs(long(dD));
    lL = abs(lL);
    if (lR == lP)
    {
        lL = lL + 1;
        lR = 0;
    }
    if ((dN < 0) & ((lR + lL) > 0))
    {
        *cMJA++ = '-';
    }
    ltoa(lL, cMJA, 10);
    if (iP > 0)
    {
        while (*cMJA != '\0')
        {
            cMJA++;
        }
        *cMJA++ = '.';
        lP = 10;
        while (iP > 1)
        {
            if (lR < lP)
            {
                *cMJA = '0';
                cMJA++;
            }
            lP = lP * 10;
            iP--;
        }
        ltoa(lR, cMJA, 10);
    }
    return String(ret);
}
