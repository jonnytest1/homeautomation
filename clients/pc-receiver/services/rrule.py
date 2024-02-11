from dateutil.rrule import rrulestr
from datetime import datetime
import sys

inputtime = sys.argv[1]
aftertime = sys.argv[2]
rules = sys.argv[3].split("RRULE:")[1]  #

start = datetime.fromtimestamp(float(inputtime)/1000)
after = datetime.fromtimestamp(float(aftertime)/1000)
ruleObj = rrulestr(rules, dtstart=start)
next = ruleObj.after(after)
print(next.isoformat())
