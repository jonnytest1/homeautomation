
import { connect } from "mqtt"
import { environment } from '../environment'


export async function checkHeat() {
  return new Promise(res => {
    const client = connect(environment.MQTT_SERVER)
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

export function heaterOff() {
  return new Promise<void>(res => {
    const client = connect(environment.MQTT_SERVER)
    client.on("connect", () => {
      client.publish(environment.HEATER_PLUG_POWER_CMD, "off", () => {
        client.publish(environment.HEATER_PLUG_POWER_CMD, "on", () => {
          console.log("reset power")
          res()
        })
      })
    })
  })
}