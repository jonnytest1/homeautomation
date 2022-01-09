
from typing import TYPE_CHECKING
from typing import List
import requests
import os
from json import encoder
from registration import device_key
encodeObj = encoder.JSONEncoder()
if TYPE_CHECKING:
    from speechevent import SpeechEvent


class Word:

    def __init__(self, words: List[str], trigger: str):
        self.words = words
        self.trigger = trigger

    def matches(self, other_word: str):
        return other_word in self.words

    def dispatch(self, event: "SpeechEvent"):
        resp = requests.post(os.environ.get("server_origin") + "/rest/sender/trigger", headers={
            'content-type': 'application/json',
            "http_x_forwarded_for": "192.168.178.___"
        }, data=encodeObj.encode({
            "deviceKey": device_key,
            "message": self.trigger,
            "timestamp": event.millis()
        }))

        if(resp.status_code != 200):
            print(resp.text)
