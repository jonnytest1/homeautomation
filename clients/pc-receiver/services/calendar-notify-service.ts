import { environment } from '../environment';
import { LinkedDateEventList } from '../util/linked-date-list';
import { fetchHttps } from '../util/request';
import { parseICS } from "node-ical"
import { NotificationHandler } from './notification-handler';
import { AlarmProvider, EventWithAlarm } from './calendar-event-with-alarm';
import { pick } from '../util/pick';
import { spawnSync } from "child_process"
import { join } from "path"
import { shouldIgnoreEvent } from './calendar-event-check';
import { logKibana } from '../util/log';

type AlarmContainer = {
  event: EventWithAlarm,
  alarm: AlarmProvider
  eventInstanceDate: Date
}
const rruleSet = new Set()

export function getNextRRule(event_start: Date, after: Date, rule: string) {
  const isoOffsetString = +event_start
  const response = spawnSync(`python`, [
    join(__dirname, "rrule.py"), `${isoOffsetString}`, `${+after}`, rule], { encoding: "utf8" })
  try {
    const data = JSON.parse(response.stdout.trim())

    if (data === null) {
      return null
    }

    return new Date(data)
  } catch (e) {
    debugger
  }
}


export class CalenderService {


  static defaultAlarmProvider: AlarmProvider = {
    getDateForEventInstance(start_or_rrule_date) {
      return new Date(start_or_rrule_date)
    },
    timeOffset: 0,
    relative: true
  }
  private reminderList = new LinkedDateEventList<AlarmContainer>()

  async load(blackList: Set<string> = new Set()) {

    const urls = environment.CAL_URL.split("🙌")

    const responses = await Promise.all(urls.map(async (u) => {
      const response = await fetchHttps(u)
      return parseICS(await response.text())
    }))


    for (const calendar of responses) {
      for (const event of Object.values(calendar)) {
        if (event.type == "VEVENT" && !blackList.has(event.uid)) {
          this.addNextForEvent(new EventWithAlarm(event))
        }
      }
    }
  }



  async addNextForEvent(evt: EventWithAlarm) {



    let alarms: Array<AlarmProvider> = [CalenderService.defaultAlarmProvider]
    if (evt.alarms.length) {
      alarms = evt.alarms
    }

    let evtDate: Date | undefined = this.getNextEventDate(evt, new Date());
    if (!evtDate) {
      // cause in past
      return
    }
    for (const alarm of alarms) {
      this.addReminder(alarm, evtDate, evt);
    }

  }


  private addReminder(alarm: AlarmProvider, evtDate: Date, evt: EventWithAlarm) {
    const alarmDate = alarm.getDateForEventInstance(evtDate);
    if (shouldIgnoreEvent(alarm, alarmDate, evtDate, evt)) {
      return
    }


    if (alarmDate > new Date()) {

      this.reminderList.add({
        timestamp: alarmDate,
        data: {
          eventInstanceDate: evtDate,
          event: evt,
          alarm: alarm
        }
      });
    }
  }

  private getNextEventDate(evt: EventWithAlarm, after: Date) {
    const rruleEvt = evt.rrule;
    let evtDate: Date | undefined = undefined;
    if (rruleEvt) {
      const [_, rule] = rruleEvt.toString().split("\n")
      const next = getNextRRule(evt.start, after, rule)
      if (next) {
        evtDate = next;


      }
    } else if (evt.start) {
      evtDate = evt.start;
      //this.eventList.add({ timestamp: evt.start, data: evt })
    }
    if (evtDate && isNaN(+evtDate)) {
      logKibana("ERROR", {
        message: "NaN for Date",
        afterDate: after.toISOString(),
        evt: JSON.stringify(evt)

      })
    }
    return evtDate;
  }

  timer() {
    const nextEvt = this.reminderList.next.value
    const timeDiff = +nextEvt.timestamp - +new Date()
    console.log(`${new Date().toLocaleTimeString()} starting timer for ${nextEvt.data.event.summary} at ${nextEvt.timestamp.toLocaleString()}`)
    console.log(`${new Date().toLocaleTimeString()} id : ${nextEvt.data.event.uid}`)


    setTimeout(async () => {
      if ((+nextEvt.timestamp + 1000) >= (Date.now())) {
        await new Promise(res => setTimeout(res, 100))
        this.timer()
      } else {
        this.doAlarm(nextEvt);
      }
    }, timeDiff)
  }



  private doAlarm(nextEvt: { timestamp?: Date; data: AlarmContainer; }) {
    console.log(`${new Date().toLocaleTimeString()} trigger alarm  ${nextEvt.data.event.summary}`)
    const data = nextEvt.data;
    this.reminderList.shift();
    new NotificationHandler({
      notification: {
        title: `EVENT`,
        body: data.event.summary,
        sound: pick(["hintnotification", "wronganswer"])
      }
    }, environment.serverip)
      .show({ send: console.log, close: () => { } } as any);


    let evtTime = +nextEvt.data.eventInstanceDate;
    const nextDateMin = new Date(Math.max(Date.now() + (1000), evtTime));

    let evtDate: Date | undefined = this.getNextEventDate(data.event, nextDateMin);
    if (evtDate) {
      console.log(`${new Date().toLocaleTimeString()} adding for ${evtDate.toISOString()}`)
      this.addReminder(data.alarm, evtDate, data.event);
    } else {
      console.log("no future recurrence from this event")
    }
    this.timer();
  }
}