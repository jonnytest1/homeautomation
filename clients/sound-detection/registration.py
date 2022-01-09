import json
import requests
import os
from json import encoder
encodeObj = encoder.JSONEncoder()
device_key = 'sound-detector'


encoder = json


def register():
    print("registering sender")

    if os.environ.get("server_origin") is None:
        raise RuntimeError("missing server_origin environment variable")
    resp = requests.post(os.environ.get("server_origin") + "/rest/sender", headers={
        'content-type': 'application/json',
        "http_x_forwarded_for": "192.168.178.___"
    }, data=encodeObj.encode({
        "deviceKey": device_key,
        "name": 'Audio Detection',
        "description":  'recognize audio and trigger depending on the context'
    }))
    print("got response from registration")
    if(resp.status_code != 200):
        print(resp.text)
        print(resp.status_code)
