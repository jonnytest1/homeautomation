
from datetime import datetime
from typing import TYPE_CHECKING
from typing import List
import requests
import os
from json import encoder
from clap.util import millis, seconds_ago
from customlogging import LogLevel, logKibana
from registration import device_key
encodeObj = encoder.JSONEncoder()
if TYPE_CHECKING:
    from speechevent import SpeechEvent


class Word:

    def __init__(self, words: List[str], trigger: str):
        self.words = words
        self.trigger = trigger
        self.last_trigger = datetime.now()

    def matches(self, other_word: str):
        return other_word in self.words

    def dispatch(self, event: "SpeechEvent"):
        print(millis(self.last_trigger))
        if seconds_ago(self.last_trigger) < 2:
            return
        self.last_trigger = datetime.now()
        logKibana(LogLevel.DEBUG, "speech event",
                  args=dict(word=self.trigger))
        resp = requests.post(os.environ.get("server_origin") + "/rest/sender/trigger", headers={
            'content-type': 'application/json',
            "http_x_forwarded_for": "192.168.178.___"
        }, verify=False, data=encodeObj.encode({
            "deviceKey": device_key,
            "message": self.trigger,
            "timestamp": millis(event.time)
        }))

        if(resp.status_code != 200):
            print(resp.text)
