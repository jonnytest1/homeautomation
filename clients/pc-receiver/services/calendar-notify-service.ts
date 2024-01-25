import { environment } from '../environment';
import { LinkedDateEventList } from '../util/linked-date-list';
import { fetchHttps } from '../util/request';
import { parseICS } from "node-ical"
import { NotificationHandler } from './notification-handler';
import { AlarmProvider, EventWithAlarm } from './calendar-event-with-alarm';
import { pick } from '../util/pick';
import { spawnSync } from "child_process"
import { join } from "path"

type AlarmContainer = {
  event: EventWithAlarm,
  alarm: AlarmProvider
}
const rruleSet = new Set()

export function getNextRRule(date: Date, rule: string) {
  const isoOffsetString = +date
  const response = spawnSync(`python`, [join(__dirname, "rrule.py"), `${isoOffsetString}`, rule], { encoding: "utf8" })

  return new Date(response.stdout.trim())
}


export class CalenderService {


  static defaultAlarmProvider: AlarmProvider = {
    getDateForEventInstance(start_or_rrule_date) {
      return new Date(start_or_rrule_date)
    },
  }
  private reminderList = new LinkedDateEventList<AlarmContainer>()

  async load() {

    const urls = environment.CAL_URL.split("🙌")

    const responses = await Promise.all(urls.map(async (u) => {
      const response = await fetchHttps(u)
      return parseICS(await response.text())
    }))


    for (const calendar of responses) {
      for (const event of Object.values(calendar)) {
        if (event.type == "VEVENT") {
          this.addNextForEvent(new EventWithAlarm(event))
        }
      }
    }

    console.log(rruleSet)
  }



  async addNextForEvent(evt: EventWithAlarm) {



    let alarms: Array<AlarmProvider> = [CalenderService.defaultAlarmProvider]
    if (evt.alarms.length) {
      alarms = evt.alarms
    }

    let evtDate: Date | undefined = this.getNextEventDate(evt);
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

    if (alarmDate > new Date()) {

      this.reminderList.add({
        timestamp: alarmDate,
        data: {
          event: evt,
          alarm: alarm
        }
      });
    }
  }

  private getNextEventDate(evt: EventWithAlarm) {
    const rruleEvt = evt.rrule;
    const now = new Date()
    let evtDate: Date | undefined = undefined;
    if (rruleEvt) {
      const [_, rule] = rruleEvt.toString().split("\n")
      const next = getNextRRule(evt.start, rule)
      if (next) {
        evtDate = next;


      }
    } else if (evt.start) {
      evtDate = evt.start;
      //this.eventList.add({ timestamp: evt.start, data: evt })
    }
    return evtDate;
  }

  async timer() {
    const nextEvt = this.reminderList.next.value
    const timeDiff = +nextEvt.timestamp - +new Date()
    console.log(`starting timer for ${nextEvt.data.event.summary} at ${nextEvt.timestamp.toLocaleTimeString()}`)


    setTimeout(() => {
      const data = nextEvt.data;
      this.reminderList.shift()
      new NotificationHandler({
        notification: {
          title: `EVENT`,
          body: data.event.summary,
          sound: pick(["hintnotification", "wronganswer"])
        }
      }, environment.serverip).show({ send: console.log, close: () => { } } as any);

      let evtDate: Date | undefined = this.getNextEventDate(data.event);
      this.addReminder(data.alarm, evtDate, data.event)
      this.timer();
    }, timeDiff)
  }


}