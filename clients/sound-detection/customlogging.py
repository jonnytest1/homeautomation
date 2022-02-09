from enum import Enum
import requests
import json
import traceback
import base64
from threading import Thread
import time
import os


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    ERROR = "ERROR"


logcounter = 0


def do_backup_request(x: dict):
    time.sleep(10)
    do_request(x)


def do_request(x: dict):
    try:
        jsonstr = json.dumps(x)
        encoded = base64.b64encode(jsonstr.encode("utf-8")).decode("utf-8")
        response = requests.post(os.environ.get("log_url"), data=encoded)

        if(response.status_code == 502):
            bT = Thread(target=do_backup_request, args=[x])
            bT.start()
    except requests.exceptions.ConnectionError:
        bT = Thread(target=do_backup_request, args=[x])
        bT.start()


def logKibana(level: LogLevel, msg: str, e: Exception = None, args=dict()):
    global logcounter
    logcounter += 1
    print(msg)
    x = {
        "application": "sounddetect",
        "Severity": level.name,
        "message": msg,
        "logStack": "".join(traceback.extract_stack().format())
    }
    x.update(args)
    x['count'] = logcounter
    if e != None:
        if not (isinstance(e, Exception)):
            x.update(e)
        else:
            x["error_message"] = ''.join(e.args)
            x["error_stacktrace"] = ''.join(traceback.format_exception(
                etype=type(e), value=e, tb=e.__traceback__))
    t = Thread(target=do_request, args=[x])
    t.start()
