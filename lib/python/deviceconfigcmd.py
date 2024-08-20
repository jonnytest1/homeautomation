from dataclasses import dataclass
from enum import Enum
from typing import Callable, Generic, TypeVar, Union

from command_invocation import CommandInvocation
from .response import SmarthomeResponse


T = TypeVar('T', bound=Enum)


@dataclass()
class DeviceConfigCommand(Generic[T]):
    name: str
    responds_with: type[T]
    callback: Callable[[CommandInvocation], Union[T, SmarthomeResponse]]
