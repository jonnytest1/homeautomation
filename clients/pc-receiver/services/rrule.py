from dateutil.rrule import rrulestr
from datetime import datetime
import sys

import pytz

inputtime = sys.argv[1]
aftertime = sys.argv[2]
rules = sys.argv[3].split("RRULE:")[1]  #
try:
    start: datetime = datetime.fromtimestamp(
        float(inputtime)/1000, tz=pytz.UTC)
    after = datetime.fromtimestamp(float(aftertime)/1000, tz=pytz.UTC)
    ruleObj = rrulestr(rules, dtstart=start)
except ValueError:
    start: datetime = datetime.fromtimestamp(float(inputtime)/1000)
    after = datetime.fromtimestamp(float(aftertime)/1000)
    ruleObj = rrulestr(rules, dtstart=start)
next = ruleObj.after(after)
if next is None:
    print("null")
    exit(0)
print(f"\"{next.isoformat()}\"")
