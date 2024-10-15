import { Battery } from '../battery'
import { PiPico } from './pipico'
import { Wire } from '../wire'
import type { Wiring } from '../wiring.a'
import { LED } from '../led'


describe("pipico test", () => {

  it("test", async () => {
    //           bat 6V
    //            |
    //     |-------------|
    //    /|    pico     |\
    //   | |-------------| |
    //    \-led(5)--/      |
    //                     |
    //         

    const battery = new Battery(6, Infinity)
    battery.enabled = true

    const pico = new PiPico()


    const led = new LED()

    const targetPin = pico.pinMap[16]
    targetPin.mode = "OUT"
    targetPin.outputValue = 1

    Wire.connect(battery.outC!, pico.pinMap[pico.tagMap.inputPwr[0]].con)
    Wire.connect(pico.pinMap[pico.tagMap.ground[0]].con, battery.inC!)

    Wire.connect(targetPin.con, led.inC!)
    Wire.connect(led.outC!, pico.pinMap[pico.tagMap.ground[1]].con)


    const steps: Array<Wiring> = []

    const res = battery.getTotalResistance(null, {
      addStep(w) {
        steps.push(w)
      }
    })
    console.log(+res.resistance.toPrecision(3))
    led.voltageDrop = -1

    expect(res.resistance.toPrecision(3)).toBe("3.33")
    battery.checkContent(1)

    expect(led.voltageDrop.toPrecision(3)).toBe("1.80")

    targetPin.mode = "IN"
    led.voltageDrop = -1
    battery.checkContent(1)
    expect(led.voltageDrop.toPrecision(3)).toBe("-1.00")
    targetPin.mode = "OUT"
    const str = battery.jsonStringify()
    debugger
  })



})