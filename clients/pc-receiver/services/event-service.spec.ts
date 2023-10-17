import { getLatestPowerOnEvent } from './event-service'

describe("event-service", () => {


  it("getLatestPowerOnEvent", () => {
    const bootEvent = getLatestPowerOnEvent()
    const eventTime = new Date(bootEvent.System.TimeCreated._attr_SystemTime)
    const diff_m = Date.now() - eventTime.valueOf()
    const minutesDiff = Math.floor(diff_m / (1000 * 60))
    debugger
  }
  )
})