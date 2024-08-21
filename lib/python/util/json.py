from datetime import datetime, timezone
from enum import Enum
import json


class SetEncoder(json.JSONEncoder):
    def default(self, o):
        if ("to_json" in dir(o)):
            return o.to_json()
        if isinstance(o, Enum):
            return o.value
        if isinstance(o, set):
            return list(o)
        if isinstance(o, datetime):
            return o.astimezone(timezone.utc).isoformat()
        return json.JSONEncoder.default(self, o)


def json_print(obj):
    return json.dumps(obj, cls=SetEncoder)
