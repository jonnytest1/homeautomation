from enum import Enum


class FeatureTopics(Enum):
    # listens for commands on this
    COMMAND = "cmnd"

    # pushes new telemetry on this
    TELE = "tele"

    RESPONSE = "response"
