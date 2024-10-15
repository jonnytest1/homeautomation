import { jsPython } from 'jspython-interpreter'
import { boundPins } from './pin'
import { TimerContext } from './timer'
import type { PiPico } from '../pipico'

export class MicroPythonExecuter {

  pythonInstance: any
  timer: TimerContext
  code: string =
    `
from machine import Pin, Timer
led = Pin(16, Pin.OUT)
timer = Timer()
def blink(timer):
  led.toggle()
timer.init(2.5, Timer.PERIODIC, blink)`


  running = false;


  constructor(environment: PiPico) {

    this.timer = new TimerContext()
    this.prepare(environment)
  }


  start() {
    this.running = true
    this.pythonInstance.evaluate(this.code).then(resp => {

      console.log("finished synchronous execution")
    })
  }


  prepare(environment: PiPico) {
    this.pythonInstance = jsPython()
    this.pythonInstance.registerPackagesLoader((p) => {

      if (p === "machine") {
        return {
          Pin: boundPins(environment), //
          Timer: this.timer.boundModule()
        }
      }


      debugger
      return {}
    })


  }
  update(newCode: string) {
    this.code = newCode

    if (this.running) {
      this.kill()
      this.start()
    }
  }


  kill() {
    this.running = false
    this.timer.stop()
  }


}