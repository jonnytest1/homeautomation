import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { execSync } from "child_process"
import { lastRun } from '../constant';
import { fetchHttps } from '../util/request';
import { TextReader } from './read-text';
import { getLatestPowerOnEvent } from './event-service';
import moment from 'moment';
import { heaterOff } from './mqtt';
type ISODay = `${number}${number}${number}${number}-${number}${number}-${number}${number}`


type RunPrefixed = typeof TimerService.run_prefixed[number]
type Data = {
  [K in RunPrefixed]?: ISODay
}
export class TimerService {


  static run_prefixed = ["12:", "18:", "23:3"] as const


  private readonly runUrl = "http://192.168.178.40/pwr"
  private readonly fasterUrl = "http://192.168.178.40/faster"
  constructor(private serverIp: string) {
    this.timer();
  }

  read(): Data {
    try {
      return JSON.parse(readFileSync(lastRun, { encoding: "utf-8" }))
    } catch (e) {
      return {}
    }
  }
  async write(data: Data) {
    await writeFile(lastRun, JSON.stringify(data))
  }

  async timer() {

    mainloop: while (true) {
      const now = moment()
      const currentIso = now.toISOString(true);
      const [today, time] = currentIso.split("T") as [ISODay, string]

      const data = this.read();
      for (const prefix of TimerService.run_prefixed) {
        const storedTs = data[prefix];

        if (storedTs !== today) {
          if (time.startsWith(prefix)) {
            if (!this.phoneReachable()) {
              console.log("didnt reach phone")
              continue mainloop
            }
            if (!this.systemStartBuffer()) {
              console.log("pc started just a few minutes ago")
              continue mainloop
            }
            data[prefix] = today
            console.log("running")
            await this.run()
            await this.write(data);
          }
        }
      }

      await new Promise(res => setTimeout(res, 10 * 1000));
    }
  }
  systemStartBuffer() {
    const bootEvent = getLatestPowerOnEvent();
    const eventTime = new Date(bootEvent.System.TimeCreated._attr_SystemTime)
    const diff_m = Date.now() - eventTime.valueOf()
    const minutesDiff = Math.floor(diff_m / (1000 * 60))
    return minutesDiff > 10
  }

  phoneReachable() {
    const logOut = execSync("ping Z-Fold5-von-Jonathan", { encoding: "utf8" })

    return !logOut.includes("Zielhost nicht erreichbar")
  }



  async run() {
    try {
      await new TextReader({ text: "get off your ass and put your shoes on" }).read();
      await this.countdown(6)
      await new Promise(res => setTimeout(res, 500));
      console.log("run")
      await new TextReader({ text: "starting treadmill" }).read();
      await fetchHttps(this.runUrl)
      await new Promise(res => setTimeout(res, 550));

      await fetchHttps(this.runUrl)
      for (let i = 0; i < 43; i++) {
        await fetchHttps(this.fasterUrl)
        await new Promise(res => setTimeout(res, 160));
      }
      setTimeout(() => {
        heaterOff()
      }, 1000 * 60 * 2)

      setTimeout(async () => {
        for (let i = 0; i < 6; i++) {
          await fetchHttps(this.fasterUrl)
          await new Promise(res => setTimeout(res, 160));
        }
      }, 1000 * 60 * 5)
      console.log("reached peak")
    } catch (e) {
      console.log("error", e)
      debugger;
    }
  }


  async countdown(ct: number) {
    for (let i = ct; i >= 0; i -= 2) {
      await new TextReader({ text: `${i} left` }).read();
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}
