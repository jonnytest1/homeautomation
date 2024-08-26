import { connect, type MqttClient } from 'mqtt';
import { fetchHttps } from '../util/request';
import { eventConfirmHandlerMap, eventHandlerMap } from './events/event-handler';
import type { FrontendReceiver } from './server-interfaces';
import { environment } from '../environment';
import { popup, popupConfig } from './popup-service';


///<reference path="../../../server/src/services/mqtt-tasmota.ts" />
class Registration {

  readonly deviceKey = 'pc-receiver';

  client: MqttClient

  async register(ip, port): Promise<void> {
    try {
      const saveResponse = await fetchHttps(`${ip}rest/receiver`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          deviceKey: this.deviceKey,
          port,
          type: 'ws',
          name: 'PC Receiver',
          description: 'Receiver located on the local machine for advanced permissions',
          actions: Object.keys(eventHandlerMap).map(key => ({
            name: key,
            confirm: !!eventConfirmHandlerMap[key] ? "1" : "0"
          }))

        } as FrontendReceiver)
      });
      if (saveResponse.status == 409) {
        console.log("receiver alreaddy existed")

      } else if (saveResponse.status !== 200) {
        const responseText = await saveResponse.text();
        throw responseText;
      }
    } catch (e) {
      console.error(e);
      await new Promise(res => setTimeout(res, 5000)).then(this.register.bind(this, ip, port));
    }


    this.client = connect({
      hostname: environment.MQTT_SERVER,
      username: environment.MQTT_USER,
      password: environment.MQTT_PASSWORD,
    })
    this.client.on("error", e => {
      debugger;
    })

    this.client.on("connect", () => {
      const commands: Array<import("../../../server/src/services/mqtt-tasmota").DeviceCommandConfig> = Object.keys(eventHandlerMap).map(key => ({
        name: key
      }));

      commands.push(popupConfig as any)

      this.client.publish("personal/discovery/pc-receiver/config", JSON.stringify({
        t: "pc-receiver", // topic
        fn: ["pc-receiver"],
        tp: ["cmnd", "tele"],
        commands: commands
      }), { retain: true })

      this.client.on("message", (topic, payload) => {
        const command = topic.match(/cmnd\/pc-receiver\/(?<command>.*)$/)
        if (command?.groups?.command) {
          const commandKey = command?.groups.command as keyof typeof eventHandlerMap | (string & {})
          const eventHandler: (payload: string) => void = eventHandlerMap[commandKey]
          if (eventHandler) {
            console.log(`running for ${commandKey}`)
            eventHandler(payload.toString());
          } else if (commandKey === "popup") {
            popup(payload.toString(), {
              response: (resp: { ts: number }) => {
                this.client.publish(`response/pc-receiver/${commandKey}/${resp.ts}`, JSON.stringify(resp));
              },
              overwrite: (payload) => {
                this.client.publish(`cmnd/pc-receiver/${commandKey}`, JSON.stringify(payload), { retain: true })
              }
            })

          }
        }
      })
      this.client.subscribe("cmnd/pc-receiver/#")
      this.livenessPing()
    })
  }


  livenessPing() {
    this.client.publish("tele/pc-receiver/SENSOR", JSON.stringify({
      timestamp: new Date().toISOString()
    }))

    setTimeout(() => {
      this.livenessPing()
    }, 10000)
  }
}

export default new Registration();