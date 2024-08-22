from dataclasses import dataclass, field
from enum import Enum
from .featuretopic import FeatureTopics
from .deviceconfigcmd import DeviceConfigCommand


@dataclass()
class DeviceConfig:
    name: str
    topic_prefixes: set[FeatureTopics]
    commands: list[DeviceConfigCommand] = field(default_factory=list)

    def to_json(self):

        command_list = []

        for command in self.commands:
            typed_cmd: DeviceConfigCommand[Enum] = command
            command_list.append(
                dict(name=command.name, responses=[c.value for c in typed_cmd.responds_with]))

        return dict(fn=[self.name], t=self.name, tp=set(self.topic_prefixes), commands=command_list)
