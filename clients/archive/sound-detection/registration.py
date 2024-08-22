import json
import requests
import os
from json import encoder

from customlogging import LogLevel, logKibana
encodeObj = encoder.JSONEncoder()
device_key = 'sound-detector'


encoder = json


def register():
    logKibana(LogLevel.DEBUG, "registering sender")

    if os.environ.get("server_origin") is None:
        raise RuntimeError("missing server_origin environment variable")
    resp = requests.post(os.environ.get("server_origin") + "/rest/sender", headers={
        'content-type': 'application/json',
        "http_x_forwarded_for": "192.168.178.___"
    },  verify=False, data=encodeObj.encode({
        "deviceKey": device_key,
        "name": 'Audio Detection',
        "description":  'recognize audio and trigger depending on the context'
    }))
    logKibana(LogLevel.DEBUG, "register request done",
              args=dict(status=resp.status_code))
    if(resp.status_code != 200 and resp.status_code != 409):
        logKibana(LogLevel.ERROR, "registering sender", args=dict(
            text=resp.text, status=resp.status_code))
