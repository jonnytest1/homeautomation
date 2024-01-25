import { Attendee, Class, DateType, DateWithTimeZone, Method, Organizer, Transparency, VEvent, VEventStatus } from 'node-ical';
import { DAY, HOUR, MINUTE, SECOND } from '../constant';
import { boolean } from 'zod';



export interface AlarmProvider {
  getDateForEventInstance(start_or_rrule_date: Date): Date
}


class EventAlarm implements AlarmProvider {

  type: "VALARM"
  trigger: string

  action: "DISPLAY"


  private timeOffset: number


  relative: boolean

  constructor(alarmConfig) {
    Object.assign(this, alarmConfig)


    this.calculateTimeOffset()
  }
  calculateTimeOffset() {
    const triggerMAtch = this.trigger.match(/(?<relative>-)?P(?<days>\d+)D.*?T?((?<hours>\d+)H)?((?<minutes>\d+)M)?((?<seconds>\d+)S)?/)
    if (!triggerMAtch) {
      console.error("invalid regex parsing TRIGGER for alarm ", this.trigger)
      return
    }

    this.relative = !!triggerMAtch.groups.relative
    const days = +triggerMAtch.groups.days
    const hours = +(triggerMAtch.groups.hours ?? 0)
    const minutes = +(triggerMAtch.groups.minutes ?? 0)
    const seconds = +(triggerMAtch.groups.seconds ?? 0)


    this.timeOffset = 0
    this.timeOffset += seconds * SECOND
    this.timeOffset += minutes * MINUTE
    this.timeOffset += hours * HOUR
    this.timeOffset += days * DAY
  }

  getDateForEventInstance(start_or_rrule_date: Date) {
    if (!this.relative) {
      const copy = new Date(start_or_rrule_date);
      copy.setHours(0)
      copy.setMinutes(0)
      copy.setSeconds(0)

      const absoulte = new Date(+copy + this.timeOffset)
      return absoulte
    }
    return new Date(start_or_rrule_date.valueOf() - this.timeOffset);
  }

}


export class EventWithAlarm implements VEvent {
  type: 'VEVENT';
  method: Method;
  dtstamp: DateWithTimeZone;
  uid: string;
  sequence: string;
  transparency: Transparency;
  class: Class;
  summary: string;
  start: DateWithTimeZone;
  datetype: DateType;
  end: DateWithTimeZone;
  location: string;
  description: string;
  url: string;
  completion: string;
  created: DateWithTimeZone;
  lastmodified: DateWithTimeZone;
  rrule?: VEvent["rrule"];
  attendee?: Attendee | Attendee[];
  recurrences?: Record<string, Omit<VEvent, 'recurrences'>>;
  status?: VEventStatus;
  organizer: Organizer;
  exdate: any;
  geo: any;
  recurrenceid: any;
  params: any[];

  public alarms: Array<EventAlarm> = []


  constructor(vEvent: VEvent) {
    Object.assign(this, vEvent);


    for (const key of Object.getOwnPropertyNames(this)) {
      const value = this[key]
      if (value?.type == "VALARM") {
        this.alarms.push(new EventAlarm(value))
        delete this[key];
      }
    }


  }

}
