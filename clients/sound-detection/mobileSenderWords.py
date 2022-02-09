from collections import namedtuple
from datetime import datetime
from json import encoder
import os
from typing import TYPE_CHECKING, List
import requests
from customlogging import LogLevel, logKibana
from util import millis, seconds_ago
from word import Word
import re

encodeObj = encoder.JSONEncoder()
if TYPE_CHECKING:
    from speechevent import SpeechEvent


class Transformation:
    name: str
    transformationKey: str


class Sender:
    deviceKey: str
    transformation: List[Transformation]


def toTuple(dict: dict):
    items = []
    for item in dict.items():
        if not item[0].startswith("_"):
            items.append(item)
    return namedtuple('X', [i[0] for i in items])(*[i[1] for i in items])


response = requests.get(os.environ.get(
    "server_origin") + "/rest/sender", {}, verify=False)
senders: List[Sender] = response.json(object_hook=toTuple)
#lambda d: namedtuple('X', [key for key in d.keys() if not key.startswith("_")])
#    (*d.values())
triggerMap = {}

for sender in senders:
    if sender.deviceKey == "mobile-device":
        for transformation in sender.transformation:
            if transformation.name is not None:
                simpleName = re.sub(
                    "[^a-zA-Z]", "", transformation.name).lower()
                triggerMap[simpleName] = transformation.transformationKey


class MobileSenderWords(Word):

    def __init__(self):
        Word.__init__(self, ["trigger "+i for i in triggerMap.keys()])

    def dispatch(self, event: "SpeechEvent"):

        print(millis(self.last_trigger))
        if seconds_ago(self.last_trigger) < 2:
            return
        self.last_trigger = datetime.now()

        transformer_name = event.word_text.split(" ").pop()
        transformer_key = triggerMap[transformer_name]

        logKibana(LogLevel.DEBUG, "speech event",
                  args=dict(word=self.trigger, type="mobile-word-sender", transformer_name=transformer_name))

        resp = requests.post(os.environ.get("server_origin") + "/rest/sender/trigger", headers={
            'content-type': 'application/json',
            "http_x_forwarded_for": "192.168.178.___"
        }, verify=False, data=encodeObj.encode({
            "deviceKey": "mobile-device",
            "message": transformer_key,
            "timestamp": millis(event.time)
        }))

        if(resp.status_code != 200):
            print(resp.text)
