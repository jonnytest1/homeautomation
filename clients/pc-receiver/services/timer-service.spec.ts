import { TimerService } from './timer-service'

describe("timer service", () => {


  it("ping", () => {

    const ts = new TimerService("")

    const reachable = ts.phoneReachable("test123")
    expect(reachable).toBe(false)
  })
})