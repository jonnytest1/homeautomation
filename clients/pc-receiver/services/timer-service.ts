import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { execSync } from "child_process"
import { DAY, lastRun, phoneName } from '../constant';
import { fetchHttps } from '../util/request';
import { TextReader } from './read-text';
import { getLatestPowerOnEvent } from './event-service';
import moment from 'moment';
import { heaterOff } from './mqtt';
import { logKibana } from '../util/log';
import { Abortable, abortable, type AbortRef } from '../util/abortable';
import { AbortError } from 'node-fetch';
type ISODay = `${number}${number}${number}${number}-${number}${number}-${number}${number}`


type RunPrefixed = typeof TimerService.run_prefixed[number]
type Data = {
  [K in RunPrefixed]?: ISODay
} & { lastSuccessFullRun?: string }

export class TimerService {


  static run_prefixed = ["12:", "18:", "20:", "23:3"] as const


  private readonly runUrl = "http://192.168.178.40/pwr"
  private readonly fasterUrl = "http://192.168.178.40/faster"

  constructor(private serverIp: string) {

  }

  read(): Data {
    try {
      return JSON.parse(readFileSync(lastRun, { encoding: "utf-8" }))
    } catch (e) {
      return {}
    }
  }
  async write(data: Data) {
    console.log("writing run file")
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
            const reachable = await this.phoneReachable(phoneName)
            if (!reachable) {
              console.log("didnt reach phone")
              continue mainloop
            }
            if (!this.systemStartBuffer()) {
              console.log("pc started just a few minutes ago")
              continue mainloop
            }
            data[prefix] = today
            console.log(`running`)
            await this.run(data)
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

  async phoneReachable(target: string, attempt = 0): Promise<boolean> {
    try {
      if (target.includes("'")) {
        throw new Error("invalid name")
      }
      const logOut = execSync(`ping ${target}`, { encoding: "utf8", })

      const reachable = !logOut.includes("Zielhost nicht erreichbar");
      if (!reachable && attempt < 3) {
        await new Promise(res => setTimeout(res, 50))
        return this.phoneReachable(target, attempt + 2)
      }
      return reachable
    } catch (e: unknown) {
      if (attempt < 3) {
        await new Promise(res => setTimeout(res, 50))
        return this.phoneReachable(target, attempt + 1)
      }
      if (e && typeof e === "object" && "stdout" in e && typeof e.stdout === "string" && e.stdout.includes("konnte Host") && e.stdout.includes("nicht finden")) {
        logKibana("WARN", { message: "exception executing ping" }, e)
        return false
      }
      logKibana("ERROR", { attempt: attempt, message: "exception executing ping" }, e)
      debugger
      return false
    }
  }



  async run(data: Data) {
    console.log("run called");
    try {
      let abortDisabled = false;
      if (data.lastSuccessFullRun) {
        const lastRun = new Date(data.lastSuccessFullRun)
        const minLAstRun = Date.now() - (DAY * 2)
        abortDisabled = +lastRun < minLAstRun
      }

      const promiseList: Array<AbortRef> = [
        (a) => new TextReader({ text: `${abortDisabled ? "really " : ""}get up and put your shoes on` }).read(a),
        ...this.countdown(6),
        () => {
          console.log("run");
          return new Promise(res => setTimeout(res, 500));
        },
        (a) => new TextReader({ text: "starting treadmill" }).read(a),
        (s) => {
          console.log("run request")
          return fetchHttps(this.runUrl, { signal: s });
        },
        Abortable.wait(0.55),
        (s) => {
          console.log("run request")
          return fetchHttps(this.runUrl, { signal: s });
        },
        Abortable.wait(1),
      ];
      for (let i = 0; i < 43; i++) {
        promiseList.push((s) => fetchHttps(this.fasterUrl, { signal: s }))
        promiseList.push(() => new Promise(res => setTimeout(res, 160)))
      }
      promiseList.push(async () => {
        console.log("reached peak")
      })
      promiseList.push(Abortable.wait(60 * 1))
      promiseList.push(async () => {
        heaterOff()
      })
      promiseList.push(Abortable.wait(60 * 1))
      promiseList.push(async (abort) => {
        let aborted = false

        abort.addEventListener("abort", () => {
          aborted = true
        })

        for (let i = 0; i < 10; i++) {
          if (aborted) {
            throw new AbortError("")
          }
          await fetchHttps(this.fasterUrl)
          if (aborted) {
            throw new AbortError("")
          }
          await new Promise(res => setTimeout(res, 160));
        }
      })
      promiseList.push((abort) => {
        data.lastSuccessFullRun = new Date().toISOString()
        console.log("set run")
        return Abortable.wait(60 * 10)(abort);
      })

      await abortable(promiseList, {
        onAbort: () => new TextReader({ text: "aborted" }).read(),
        onAbortAttempt: () => new TextReader({ text: "not this time" }).read(),
        abortDisabled: abortDisabled
      })
      console.log("finished run timer")
    } catch (e) {
      logKibana("ERROR", "error during run", e)
      await new Promise(res => setTimeout(res, 5000));
      console.log("error", e)
      debugger;
    }
  }


  countdown(ct: number) {
    const countdownCallbacks: Array<AbortRef> = []
    for (let i = ct; i >= 0; i -= 2) {
      countdownCallbacks.push((a) => new TextReader({ text: `${i} left` }).read(a))
      countdownCallbacks.push(Abortable.wait(2))
    }
    return countdownCallbacks
  }
}
