import type { NodeOptionTypes } from './generic-node/typing/generic-node-type'
import type { CommandsEvent } from './mqtt-types'


export interface DiscoveryConfigEvent {
  fn: Array<string | null>
  t: string //topic
  tp: Array<string> // topic prefixes

  commands?: Array<{ name: string }>
}


export class DeviceConfig {

  public mqttDeviceName: string

  public topicPrefixes: Array<string>
  public friendlyName: string

  commands: Array<{ name: string, argument?: NodeOptionTypes }> = []
  constructor(public discoveryid: string, evt: DiscoveryConfigEvent, commandprops?: CommandsEvent) {
    this.mqttDeviceName = evt.t;
    this.topicPrefixes = evt.tp
    this.friendlyName = evt.fn.filter(el => el != null).join(",")

    if (evt.commands) {
      this.commands = evt.commands
    } else if (commandprops) {
      this.commands = commandprops.commands
    }
  }


  getTelemetry() {
    if (this.topicPrefixes.includes("tele")) {
      return `tele/${this.mqttDeviceName}/SENSOR`
    }
    throw new Error("unknown telemetry syntax")
  }

  getCommandTopic() {
    if (this.topicPrefixes.includes("cmnd")) {
      return `cmnd/${this.mqttDeviceName}/`
    }
    throw new Error("unknown command syntax")
  }
}



export type MQTTEvent = DiscoveryConfigEvent
