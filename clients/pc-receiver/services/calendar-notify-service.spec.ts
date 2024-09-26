import type { DateWithTimeZone, VEvent } from 'node-ical'
import { EventWithAlarm } from './calendar-event-with-alarm'
import { CalenderService, getNextRRule } from './calendar-notify-service'
import { uidBlackList } from './calendar-uid-blacklist'
import { MINUTE } from '../constant'
import { GeneratedAPIs } from 'googleapis/build/src/apis'




describe("calender", () => {
  it("alerts", async () => {

    const service = new CalenderService()
    await service.load(uidBlackList)
    service.timer()
    await new Promise(res => { })
  }, 99999999)


  it("alerts 2", async () => {

    const service = new CalenderService()

    const now = Date.now()
    const evt = new Date(now + (5 * MINUTE) + 3000) as DateWithTimeZone
    evt.tz = "Europe/Berlin"
    service.addNextForEvent(new EventWithAlarm({
      type: "VEVENT",
      start: evt,
      summary: "test event",
      [`${Math.random()}`]: {
        type: "VALARM",
        trigger: `-P0DT0H5M`
      }

    } as Partial<VEvent> as VEvent))
    expect(service["reminderList"].next?.value).toBeTruthy()
    service.timer()
    await new Promise(res => { })
  }, 99999999)


  it("get next rrule", () => {

    const z = '2023-09-27T23:01:00.000+02:00'

    const t = '2024-01-23T20:30:00.000+01:00'

    const nextT = getNextRRule(new Date(t), new Date(), "RRULE:FREQ=DAILY")?.toLocaleString()
    const nextZ = getNextRRule(new Date(z), new Date(), "RRULE:FREQ=DAILY")?.toLocaleString()


    expect(nextZ).toContain("23:01")
    expect(nextT).toContain("20:30")
  })


  it("get next rrule after", () => {
    const z = '2023-09-27T23:01:00.000+02:00'

    const next = getNextRRule(new Date(z), new Date(z), "RRULE:FREQ=DAILY")?.toLocaleString()
    expect(next).toBe("28.9.2023, 23:01:00")

    const oneMilliPrior = +new Date(z) - 1
    const nextOneSec = getNextRRule(new Date(z), new Date(oneMilliPrior), "RRULE:FREQ=DAILY")?.toLocaleString()
    expect(nextOneSec).toBe("27.9.2023, 23:01:00")
  })
})