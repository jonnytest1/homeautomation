import { DeviceConfig, DiscoveryConfigEvent } from './mqtt-tasmota'
import { emitEvent } from './generic-node/generic-node-service'
import { environment } from '../environment'
import { logKibana } from '../util/log'
import { ResolvablePromise } from '../util/resolvable-promise'
import { MqttClient, connect } from "mqtt"
import type { CommandsEvent } from './mqtt-types'




export class MQTTIntegration {

  static discoveryRegex = /(?<factory>[^/]*)\/discovery\/(?<deviceid>[^/]*)\/config/
  static commandaddonRegex = /(?<factory>[^/]*)\/discovery\/(?<deviceid>[^/]*)\/commands/

  private connection: MqttClient

  private resolvers: Record<string, ResolvablePromise<string>> = {}

  private deviceMap: Record<string, DeviceConfig> = {}
  private commandMap: Record<string, CommandsEvent> = {}
  constructor() {
    const mqttUrl = environment.MQTT_SERVER
    this.connection = connect(mqttUrl)

    this.connection.on("connect", () => {

      this.connection.on("message", (topic, message) => {
        try {
          const messageStr = message.toString()

          let matchedDevice: null | DeviceConfig = null
          for (const device of Object.values(this.deviceMap)) {
            if (topic.includes(device.mqttDeviceName)) {
              matchedDevice = device
              break;
            }
          }
          emitEvent("mqtt subscribe", {
            payload: messageStr,
            context: {
              topic: topic,
              device: matchedDevice
            }
          })

          for (const resolvertopic in this.resolvers) {
            if (resolvertopic.startsWith(topic)) {
              this.resolvers[resolvertopic].resolve(messageStr)
              delete this.resolvers[resolvertopic]
              return
            }
          }
          const configDiscovery = topic.match(MQTTIntegration.discoveryRegex)
          if (configDiscovery) {
            const evt = JSON.parse(messageStr)
            if (!configDiscovery.groups?.deviceid) {
              throw new Error("didnt get discoveryid")
            }
            const commandEvent = this.commandMap[configDiscovery.groups?.deviceid]
            const evtData = new DeviceConfig(configDiscovery.groups?.deviceid, evt as DiscoveryConfigEvent, commandEvent)
            this.deviceMap[evtData.mqttDeviceName] ??= evtData
            console.log(this.deviceMap)
          }

          const commandAddOn = topic.match(MQTTIntegration.commandaddonRegex)
          if (commandAddOn && commandAddOn.groups?.deviceid) {
            const matchedDevice = Object.values(this.deviceMap)
              .find(d => d.discoveryid === commandAddOn.groups?.deviceid)
            const evt = JSON.parse(messageStr) as CommandsEvent
            if (matchedDevice) {
              matchedDevice.commands = evt.commands
            }
            this.commandMap[commandAddOn.groups?.deviceid] = evt
          }
        } catch (e) {
          debugger
        }
      })

      this.connection.subscribe("#", { rh: 1, qos: 1 }, (err,) => {
        if (err) {
          logKibana("ERROR", "error connecting to mqtt")
        }
      })
    })
  }

  getDevice(topic: string) {
    const deviceName = topic.replace("tele/", "").replace("cmnd/", "")
      .split("/")[0]
    return this.deviceMap[deviceName]
  }

  getData(topic: string) {
    if (topic.includes("#")) {
      throw new Error("# not implemented")
    }
    const pr = new ResolvablePromise<string>()
    this.resolvers[topic] = pr
    this.connection.subscribe(topic, { rh: 1, qos: 1 }, (err,) => {
      if (err) {
        logKibana("ERROR", "error connecting to mqtt")
      }
    })
    return pr.prRef

  }

  public getDevices() {
    return this.deviceMap
  }


  public getSubscribable() {
    return Object.values(this.deviceMap).map(device => device.getTelemetry())
  }

  public getPublishable() {
    return Object.values(this.deviceMap).map(device => device.getCommandTopic())
  }
}



export const mqttConnection = new MQTTIntegration()
