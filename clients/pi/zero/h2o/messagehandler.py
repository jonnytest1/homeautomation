

from datetime import datetime, timedelta
from time import sleep
from typing import Union
import paho.mqtt.client as mqtt
from gpios import led, relay
from multiprocessing import Process

refill_trigger_valid_until: Union[datetime, None] = None

refill_active_seconds = 5


def led_delayed_off():
    sleep(refill_active_seconds)
    invalidate()


def set_valid():
    global refill_trigger_valid_until
    valid_until = datetime.now() + timedelta(seconds=refill_active_seconds)
    refill_trigger_valid_until = valid_until
    led.on()

    ledtimer = Process(target=led_delayed_off,
                       name='Process_inc_forever')
    ledtimer.start()


def invalidate():
    global refill_trigger_valid_until
    led.off()
    refill_trigger_valid_until = None


def refill():
    invalidate()
    print("refill command triggered")
    relay.on()
    sleep(7)
    relay.off()
    print("reset")


def on_message(client, user, msg: mqtt.MQTTMessage):
    global refill_trigger_valid_until
    print(user, msg)
    command = msg.topic.split("cmnd/water-supply/")[1]

    if command == "refill":
        if refill_trigger_valid_until is None or refill_trigger_valid_until < datetime.now():
            set_valid()
        else:
            refill()
