

from dataclasses import dataclass
from datetime import datetime
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion

from .commandinvocation import CommandInvocation

from .featuretopic import FeatureTopics

from .deviceconfigcmd import DeviceConfigCommand

from .deviceconfig import DeviceConfig
from .util.json import json_print
from .devgpios import leds


@dataclass()
class MqttConfig:
    url: str
    user: str
    password: str


class SmartHome:

    setup_done = False

    def __init__(self, mqtt_config: MqttConfig, device_config: DeviceConfig, with_gpio=True):
        self.with_gpio = with_gpio
        self.mqtt = mqtt_config
        self.config = device_config

        self.command_dict: dict[str, DeviceConfigCommand] = dict()
        for command in self.config.commands:
            self.command_dict[command.name] = command

        if (self.with_gpio):
            leds.init()

    def update_telemetry(self, data: dict):
        data["timestamp"] = datetime.now()

        message = self.mqttclient.publish(
            f"tele/{self.config.name}/SENSOR", json_print(data), retain=True)

        message.wait_for_publish(5)

    def setup(self):
        self.mqttclient = mqtt.Client(CallbackAPIVersion.VERSION2)
        self.mqttclient.username_pw_set(self.mqtt.user, self.mqtt.password)

        def on_connect(client, userdata, flags, rc, prop):
            if (self.with_gpio):
                leds.mqtt_led.on()
            print("MQtt Connected: ", rc)

            if FeatureTopics.COMMAND in self.config.topic_prefixes:
                self.mqttclient.subscribe(f"cmnd/{self.config.name}/#")

            config_json = json_print(self.config)
            print("publishing config: ", config_json)

            self.mqttclient.publish(
                f"personal/discovery/{self.config.name}/config", config_json, retain=True)

        def on_message(client, user, msg: mqtt.MQTTMessage):

            invocation = CommandInvocation(message=msg, sm=self, user=user)
            invocation.invoke()

        self.mqttclient.on_message = on_message

        self.mqttclient.on_connect = on_connect

        self.setup_done = True

    def serve_forever(self):

        self.connect()

        self.mqttclient.loop_forever()

    def start_serve(self):

        self.connect()

        self.mqttclient.loop_start()

    def connect(self):
        if not self.setup_done:
            self.setup()

        errored = True
        while errored:
            try:
                self.mqttclient.connect(self.mqtt.url, 1883, 60,)
                errored = False
            except OSError as e:
                print("error in mqtt connect retrying ", e)
                # could be network errors
                errored = True
