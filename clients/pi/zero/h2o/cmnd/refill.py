from datetime import datetime, timedelta
from enum import Enum
from multiprocessing import Process
from time import sleep
from typing import Any, Literal, Union
from cmnd.relay import relay
from smarthome import DeviceConfigCommand, CommandInvocation, devgpios


class RefillResponse(Enum):
    CONFIRM = "confirm"
    REFILLING = "refilling"
    BLOCKED = "blocked"


refill_trigger_valid_until: Union[datetime, None, Literal["blocked"]] = None
refill_trigger_valid_from: Union[datetime, None] = None

refill_active_seconds = 6
min_delay_seconds = 1


def led_delayed_off():
    sleep(refill_active_seconds)
    invalidate()


def set_valid():
    global refill_trigger_valid_until
    global refill_trigger_valid_from
    valid_until = datetime.now() + timedelta(seconds=refill_active_seconds)

    refill_trigger_valid_from = datetime.now() + timedelta(seconds=min_delay_seconds)
    refill_trigger_valid_until = valid_until
    devgpios.leds.connectionstatus.on()

    ledtimer = Process(target=led_delayed_off,
                       name='Process_inc_forever')
    ledtimer.start()


def invalidate():
    devgpios.leds.connectionstatus.off()


def refill():
    invalidate()
    print("refill command triggered")
    relay.on()
    sleep(7)
    relay.off()
    print("reset")


def onrefill(inv: CommandInvocation):
    global refill_trigger_valid_until
    print(inv.user, inv.message)

    if refill_trigger_valid_until == "blocked":
        return RefillResponse.BLOCKED
    elif refill_trigger_valid_until is None or refill_trigger_valid_until < datetime.now():
        set_valid()
        return RefillResponse.CONFIRM
    else:
        if refill_trigger_valid_from is None or refill_trigger_valid_from > datetime.now():
            return RefillResponse.CONFIRM
        refill_trigger_valid_until = "blocked"
        refill()
        refill_trigger_valid_until = None
        return RefillResponse.REFILLING


refillcmd = DeviceConfigCommand(
    name="refill", callback=onrefill, responds_with=RefillResponse)
