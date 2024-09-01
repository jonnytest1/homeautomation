
from dataclasses import dataclass
from enum import Enum
import json
import paho.mqtt.client as mqtt
from typing import TYPE_CHECKING, Any
from .response import SmarthomeResponse

from .featuretopic import FeatureTopics
from .util.json import json_print
if TYPE_CHECKING:
    from .smarthome import SmartHome


@dataclass()
class CommandInvocation:
    message: mqtt.MQTTMessage
    sm: "SmartHome"
    user: Any

    def invoke(self):
        self.command = self.message.topic.split(
            f"cmnd/{self.sm.config.name}/")[1]

        command_ref = self.sm.command_dict[self.command]

        if command_ref is not None:
            print(f"handling message for {self.command}")
            response = command_ref.callback(self)

            if FeatureTopics.RESPONSE in self.sm.config.topic_prefixes:
                if response is None:
                    print("!! missing return value for "+self.command)
                elif (response == SmarthomeResponse.DELAYED):
                    evt = json.loads(self.message.payload)
                    self.ts = evt["timestamp"]
                    return
                elif isinstance(response, str):
                    print("sending response for "+self.command + " "+response)
                    evt = json.loads(self.message.payload)
                    self.ts = evt["timestamp"]
                    self.sm.mqttclient.publish(
                        f"{FeatureTopics.RESPONSE.value}/{self.sm.config.name}/{self.command}/{self.ts}", json_print(dict(response=response)), retain=False)

    def reply(self, response: Enum):
        self.sm.mqttclient.publish(
            f"{FeatureTopics.RESPONSE.value}/{self.sm.config.name}/{self.command}/{self.ts}", json_print(dict(response=response)), retain=False)
        pass
