import type { MicroPythonExecuter } from './executer'



export class TimerContext {


  intervals: Array<NodeJS.Timeout> = []

  constructor() {

  }

  boundModule() {
    const self = this;
    function Timer() {
      return {
        init(freq: number, mode, callback) {


          if (mode === Timer.PERIODIC) {
            self.intervals.push(setInterval(callback, freq * 1000))
          } else {
            debugger
          }
        }
      }

    }

    Timer.PERIODIC = "PERIODIC"

    return Timer
  }
  stop() {
    for (const timer of this.intervals) {
      clearInterval(timer)
    }
  }
}




