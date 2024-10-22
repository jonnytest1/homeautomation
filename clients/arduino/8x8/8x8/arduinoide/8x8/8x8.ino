#include <Arduino.h>

#include <WiFi.h>
#include "led.h"
#include "lib/wi_fi.h"
#include "lib/prop.h"
#include <MQTT.h>
#include "mqtt_cred.h"
#include <ArduinoJson.h>
#define DATA_PIN 14
#define LED_TYPE WS2812B

WiFiClient cli;
MQTTClient client;


bool configPublished=false;

const String configJsonString = R"({
  "fn": ["8x8matrix"],
  "t": "8x8matrix",
  "tp": ["cmnd"],
  "commands": [{
    "name": "display",
    "responses":["done"],
    "asyncRetained": true,
    "argument": [
        { "name":"num1","type": "number" }, { "name":"num2","type": "number" }, 
        { "name":"num3","type": "number" }, { "name":"num4","type": "number" }
    ]
  }]
})";


void onMessage(String &topic, String &payload)
{

  JsonDocument doc;
  deserializeJson(doc, payload);

  long  num1=doc["num1"];
  long  num2=doc["num2"];
  long  num3=doc["num3"];
  long  num4=doc["num4"];
  
  clear();
  if(num3==0&&num2==0&&num4==0&& num1<10){
    singleDigit(num1, CRGB::Orange);
  }else{
    setBitBlock(1, num1,num2, num3,num4, CRGB::Orange);
  }
  FastLED.show();

  double ts=doc["timestamp"];
  String tsStr(ts);
  String response="done";
  String rTopic=String("response/")+getDeviceKey().c_str()+"/display/"+tsStr;
  client.publish(rTopic,response);
}

void setup()
{
  FastLED.addLeds<LED_TYPE, DATA_PIN>(leds, NUM_LEDS);
  waitForWifi();
  
  client.setHost("mqtt.fritz.box", 1883);
  client.onMessage(onMessage);
  client.begin(cli);
  FastLED.setBrightness(10);

  for(int i=0;i<8;i++){
    clear();
    leds[i]=CRGB::Green;
    FastLED.show();
    delay(10);
  }
}

void reconnect() {
  // Loop until we're reconnected
  int i=0;
  while (!client.connected()) {
    i++;
    clear();
    leds[i]=CRGB::Orange;
    FastLED.show();
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("8x8", mqttuser, mqttpwd)) {
      leds[i]=CRGB::Brown;
      FastLED.show();
      delay(10);
      if(!configPublished){
        String discoveryTopic=String("personal/discovery/")+getDeviceKey().c_str()+"/config";
        if(client.publish(discoveryTopic.c_str(),configJsonString,true,0)){
          leds[i]=CRGB::Green;
          FastLED.show();
          configPublished=true;
        }else{
          leds[i]=CRGB::Red;
        }
      }
      FastLED.show();
      delay(5000);
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.subscribe(String("cmnd/")+getDeviceKey().c_str()+"/display");
      //client.publish("outTopic","hello world");
      // ... and resubscribe
      //client.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      //Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(1000);
    }
  }
}
// the loop function runs over and over again forever
void loop()
{
  //Serial.println("loop");

  if (!client.connected()) {
    reconnect();
  }
  client.loop();
/*
  clear();
  FastLED.show();
  delay(500);

  leds[0] = CRGB::Black;
  FastLED.show();
  delay(500);*/
  /*for (int i = 0; i < 10; i++)
  {
    clear();
    FastLED.show();
    delay(100);
    singleDigit(i, CRGB::Red);
    delay(800);
  }*/
/*
  for (int i = 0; i < 11; i++)
  {
    clear();
    setBitBlock(1, i, i, i, i, CRGB::Orange);
    FastLED.show();
    delay(800);
  }*/
}