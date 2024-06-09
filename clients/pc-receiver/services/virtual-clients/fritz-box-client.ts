import { phoneName, pythonExe } from '../../constant'
import { join } from "path"
import { execSync } from "child_process"
import { environment } from '../../environment'
import { response } from 'express'

import { Agent } from "https"
import { fetchHttps } from '../../util/request'
import { eventHandlerMap } from '../events/event-handler'
import { logKibana } from '../../util/log'


interface BandData {
  rssi: number
}

type WlanDevices = Array<{
  name: string
  ip: string
  type: "active" | "passive"
  bands: {
    ghz5: BandData
    ghz24: BandData
  }
}>

interface SSIDResposne {
  data: {
    wlanSettings: {
      knownWlanDevices: WlanDevices
    }
  }
  timeTillLogout
}


export class FritzBoxClient {

  sid?: string


  prevRssi: number | undefined
  getSid() {
    const result = execSync(`${pythonExe} ${join(__dirname, "fritz-session.py")} http://fritz.box/ ${environment.FRITZ_USER} ${environment.FRITZ_PWD}`, { encoding: "utf8" })

    return result.split("sid: ")[1].trim()
  }


  async getRSSIData() {
    if (!this.sid) {
      this.sid = this.getSid()
    }

    try {
      const result = execSync(`${pythonExe} ${join(__dirname, "firtz-wlandevices.py")}  ${this.sid}`, { encoding: "utf8" })
      const responseData = JSON.parse(result)
      if (responseData.timeTillLogout < 10) {
        setTimeout(() => {
          this.sid = this.getSid()
        }, 1)
      }
      return responseData.data.wlanSettings.knownWlanDevices
    } catch (e) {
      debugger
      this.sid = undefined
      throw new Error("got not ok response " + e.status)
    }

  }

  getCurrentVolume() {
    const cmd = `powershell -Command " Get-AudioDevice -PlaybackVolume"`

    const result = execSync(cmd, { encoding: "utf8" })
    const percentage = +result.trim().replace("%", "")
    return percentage
  }

  async checkResponse(data: WlanDevices) {
    const phone = data.find(dev => dev.name === phoneName)
    // const current = this.getCurrentVolume()

    if (phone.type !== "active") {
      return
    }

    for (const band in phone.bands) {
      const bandData: BandData = phone.bands[band]
      if (bandData.rssi !== undefined) {

        if (this.prevRssi === undefined) {
          this.prevRssi = bandData.rssi
        }

        if (this.prevRssi > bandData.rssi) {
          console.log(this.prevRssi, bandData.rssi)
          logKibana("DEBUG", "increasing volume from device distance")
          const diff = this.prevRssi - bandData.rssi
          for (let i = 0; i < (10 * diff); i++) {
            eventHandlerMap['volume up']()
            await new Promise(r => setTimeout(r, 100))
          }
        }

        this.prevRssi = bandData.rssi
        console.log(new Date().toISOString(), bandData.rssi)
      }
    }

  }
  async start() {

    while (true) {
      try {
        const rssiData = await this.getRSSIData()
        await this.checkResponse(rssiData)

      } catch (e) {
        console.log("error checking rssi");
      }
      await new Promise(res => setTimeout(res, 200))

    }
  }
}