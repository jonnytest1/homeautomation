
from enum import Enum
from smarthome import DeviceConfigCommand, CommandInvocation
from relay import relay


class RefillResponse(Enum):
    STOPPED = "stopped"


def ostop(inv: CommandInvocation):
    relay.off()
    return RefillResponse.STOPPED


stopcmd = DeviceConfigCommand(
    name="stop", callback=ostop, responds_with=RefillResponse)
