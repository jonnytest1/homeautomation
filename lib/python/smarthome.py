

from dataclasses import dataclass
from datetime import datetime
import paho.mqtt.client as mqtt
from paho.mqtt.enums import CallbackAPIVersion

from .commandinvocation import CommandInvocation

from .featuretopic import FeatureTopics

from .deviceconfigcmd import DeviceConfigCommand

from .deviceconfig import DeviceConfig
from .util.json import json_print
from .devgpios import mqtt_led


@dataclass()
class MqttConfig:
    url: str
    user: str
    password: str


class SmartHome:

    setup_done = False

    def __init__(self, mqtt_config: MqttConfig, device_config: DeviceConfig):
        self.mqtt = mqtt_config
        self.config = device_config

        self.command_dict: dict[str, DeviceConfigCommand] = dict()
        for command in self.config.commands:
            self.command_dict[command.name] = command

    def update_telemetry(self, data: dict):
        data["timestamp"] = datetime.now()

        self.mqttclient.publish(
            f"tele/{self.config.name}/SENSOR", json_print(data), retain=True)

    def setup(self):
        self.mqttclient = mqtt.Client(CallbackAPIVersion.VERSION2)
        self.mqttclient.username_pw_set(self.mqtt.user, self.mqtt.password)

        def on_connect(client, userdata, flags, rc, prop):
            mqtt_led.on()
            print("MQtt Connected: ", rc)

            if FeatureTopics.COMMAND in self.config.topic_prefixes:
                self.mqttclient.subscribe(f"cmnd/{self.config.name}/#")

            self.mqttclient.publish(
                f"personal/discovery/{self.config.name}/config", json_print(self.config), retain=True)

        def on_message(client, user, msg: mqtt.MQTTMessage):

            invocation = CommandInvocation(message=msg, sm=self)
            invocation.invoke()

        self.mqttclient.on_message = on_message

        self.mqttclient.on_connect = on_connect

        self.setup_done = True

    def serve_forever(self):

        if not self.setup_done:
            self.setup()

        errored = True
        while errored:
            try:
                self.mqttclient.connect(self.mqtt.url, 1883, 60,)
                errored = False
            except OSError as e:
                # could be network errors
                errored = True

        self.mqttclient.loop_forever()
