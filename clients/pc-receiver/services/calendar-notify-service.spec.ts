import { CalenderService, getNextRRule } from './calendar-notify-service'


function nextrruule(start): Date {
  return getNextRRule(new Date(start), "RRULE:FREQ=DAILY")
}


describe("calender", () => {
  it("alerts", async () => {

    const service = new CalenderService()
    await service.load()
    service.timer()
    await new Promise(res => { })
  }, 99999999)





  it("get next rrule", () => {

    const z = '2023-09-27T23:01:00.000+02:00'
    '2023-09-27T21:01:00.000Z'

    const t = '2024-01-23T20:30:00.000+01:00'
    '2024-01-23T19:30:00.000Z'

    const nextT = nextrruule(t).toLocaleString()
    const nextZ = nextrruule(z).toLocaleString()


    expect(nextZ).toContain("23:01")
    expect(nextT).toContain("20:30")



  })
})