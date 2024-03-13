import { connect, type MqttClient } from 'mqtt';
import { fetchHttps } from '../util/request';
import { eventConfirmHandlerMap, eventHandlerMap } from './events/event-handler';
import type { FrontendReceiver } from './server-interfaces';
import { environment } from '../environment';
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


    this.client = connect(environment.MQTT_SERVER)
    this.client.on("connect", () => {
      this.client.publish("personal/discovery/pc-receiver/config", JSON.stringify({
        t: "pc-receiver", // topic
        fn: ["pc-receiver"],
        tp: ["cmnd", "tele"],
        commands: Object.keys(eventHandlerMap).map(key => ({
          name: key
        }))
      }), { retain: true })

      this.client.on("message", (topic, payload) => {
        const command = topic.match(/cmnd\/pc-receiver\/(?<command>.*)$/)
        if (command?.groups?.command) {
          const commandKey = command?.groups.command as keyof typeof eventHandlerMap
          const eventHandler = eventHandlerMap[commandKey]
          if (eventHandler) {
            eventHandler();
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