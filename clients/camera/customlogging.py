from enum import Enum
import requests
import json
import traceback
import base64
from threading import Thread


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    ERROR = "ERROR"


logcounter = 0


def doRequest(x):

    jsonstr = json.dumps(x)
    encoded = base64.b64encode(jsonstr.encode("utf-8")).decode("utf-8")
    requests.post(
        "https://pi4.e6azumuvyiabvs9s.myfritz.net/tm/libs/log/index.php", data=encoded)


def logKibana(level: LogLevel, msg: str, e: Exception = None, args=dict()):
    global logcounter
    logcounter += 1

    if isinstance(level, LogLevel):
        level = level.value

    x = {
        "application": "pythonpicam",
        "Severity": level,
        "message": msg,
    }
    x.update(args)
    x['count'] = logcounter
    if e != None:
        x["error_message"] = ''.join(e.args)
        x["error_stacktrace"] = ''.join(traceback.format_exception(
            etype=type(e), value=e, tb=e.__traceback__))
    t = Thread(target=doRequest, args=[x])
    t.start()
