# this is a mock file definition cause RPi cant be imported on windwos


from enum import Enum
from typing import Callable


class PIN_NUMBERING_MODE(Enum):
    BOARD = 1
    BCM = 2


BOARD = PIN_NUMBERING_MODE.BOARD

BCM = PIN_NUMBERING_MODE.BCM


class PIN_MODE(Enum):
    IN = 1
    OUT = 2
    BOTH = 3


IN = PIN_MODE.IN
OUT = PIN_MODE.OUT
BOTH = PIN_MODE.BOTH


def setmode(mode: PIN_NUMBERING_MODE):
    pass


def setup(inpin, mode: PIN_MODE):
    pass


def input(pin: int) -> float:
    return 1


def add_event_detect(pin: int, mode: PIN_MODE, callback: Callable[[int], None]):
    pass


def cleanup():
    pass
