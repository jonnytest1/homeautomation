from dateutil.rrule import rrulestr
from datetime import datetime
import sys

inputtime = sys.argv[1]
rules = sys.argv[2].split("RRULE:")[1]  #

start = datetime.fromtimestamp(float(inputtime)/1000)

ruleObj = rrulestr(rules, dtstart=start)
next = ruleObj.after(datetime.now())
print(next.isoformat())
