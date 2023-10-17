import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { execSync } from "child_process"
import { lastRun } from '../constant';
import { fetchHttps } from '../util/request';
import { TextReader } from './read-text';
import { getLatestPowerOnEvent } from './event-service';

type ISODay = `${number}${number}${number}${number}-${number}${number}-${number}${number}`
interface Data {
  lastRun?: ISODay
  lastRunEv?: ISODay
}
export class TimerService {


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
    while (true) {
      const now = new Date();
      const today = now.toISOString().split("T")[0] as ISODay
      const hour = new Date().getHours();
      if (hour == 12) {
        const data = this.read();
        console.log(data.lastRun, today)
        if (data.lastRun !== today) {
          if (!this.phoneReachable()) {
            console.log("didnt reach phone")
            continue
          }
          data.lastRun = today
          console.log("running")
          await this.run()
          await this.write(data);
        }
      } else if (hour == 18) {
        const data = this.read();
        console.log(data.lastRunEv, today)
        if (data.lastRunEv !== today) {
          if (!this.phoneReachable()) {
            console.log("didnt reach phone")
            continue
          }
          if (!this.systemStartBuffer()) {
            console.log("didnt reach phone")
            continue
          }
          data.lastRunEv = today
          console.log("running")
          await this.run()
          await this.write(data);
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
    const logOut = execSync("ping 192.168.178.31", { encoding: "utf8" })

    return logOut.includes("Antwort von ")
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
      for (let i = 0; i < 40; i++) {
        await fetchHttps(this.fasterUrl)
        await new Promise(res => setTimeout(res, 160));
      }
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
