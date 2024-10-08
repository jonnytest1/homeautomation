
import { connect } from "mqtt"
import { environment } from '../environment'


export async function checkHeat() {
  return new Promise(res => {
    const client = getClient()
    client.on("connect", () => {
      client.on("message", (topic, message) => {
        console.log(topic)
        const messageSTr = message.toString()
        const evt = JSON.parse(messageSTr) as {
          ENERGY: {
            Power: number
          }
        }
        console.log(evt.ENERGY.Power)

      })
      /*client.subscribe("tele/tasmota_F97A30/SENSOR", { rh: 1, qos: 1 }, (err,) => {
        if (err) {
          logKibana("ERROR", "error connecting to mqtt")
        }
      })*/
    })
  })
}

export function getClient() {
  return connect({
    hostname: environment.MQTT_SERVER,
    username: environment.MQTT_USER,
    password: environment.MQTT_PASSWORD,
  })
}

export function heaterOff() {
  const cmndSTart = Date.now()
  return new Promise<void>(res => {
    const client = getClient()
    client.on("connect", () => {
      if (cmndSTart < (Date.now() - (1000 * 60))) {
        client.end()
        return
      }
      client.publish(environment.HEATER_PLUG_POWER_CMD, "off", async () => {
        await new Promise(res => setTimeout(res, 1000))
        client.publish(environment.HEATER_PLUG_POWER_CMD, "on", () => {
          console.log("reset power")
          res()
          client.end()
        })
      })
    })
  })
}