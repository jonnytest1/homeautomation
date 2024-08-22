from time import sleep
from smarthome import DeviceConfigCommand
from enum import Enum
import RPi.GPIO as GPIO


beepPin = 26


class StartResponse(Enum):
    DONE = "done"


def beep_off():
    GPIO.setup(beepPin, GPIO.IN)


def beep_on():
    GPIO.setup(beepPin, GPIO.OUT)


def onbeep(inv):
    beep_on()
    sleep(0.5)
    beep_off()
    return StartResponse.DONE


GPIO.setmode(GPIO.BCM)

beep_off()
beepcmd = DeviceConfigCommand(
    name="beep", callback=onbeep, responds_with=StartResponse)
