
import type { NodeOptionTypes } from './generic-node/typing/node-options'
import type { CommandsEvent } from './mqtt-types'

//  https://tasmota.github.io/docs/Commands/#mqtt
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

  commands: Array<{ name: string, argument?: NodeOptionTypes, responses?: Array<string> }> = []

  iscommandsSet = false
  constructor(public discoveryid: string, evt: DiscoveryConfigEvent, commandprops?: CommandsEvent) {
    this.mqttDeviceName = evt.t;
    this.topicPrefixes = evt.tp
    this.friendlyName = evt.fn.filter(el => el != null).join(",")

    if (evt.commands) {
      this.commands = evt.commands
      this.iscommandsSet = true
    } else if (commandprops) {
      this.commands = commandprops.commands
      this.iscommandsSet = true
    }
  }
  setCommands(commands: typeof this.commands) {
    this.commands = commands
    this.iscommandsSet = true
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
    console.error("unknown command syntax", this.friendlyName, this.mqttDeviceName)
    return false
  }

  sendsResponse() {
    return this.topicPrefixes.includes("response")
  }
}


export function defaultCommandConfig() {
  return {
    "commands": [
      {
        "name": "Power0",
        "argument": {
          "type": "select",
          "options": [
            "on",
            "off"
          ]
        }
      },
      {
        "name": "FriendlyName",
        "argument": {
          "type": "text"
        },
        "flags": {
          needsRedstart: true
        }
      },
      {
        "name": "SensorRetain",
        "argument": {
          "type": "select",
          "options": [
            "on",
            "off"
          ]
        }
      },
      {
        "name": "Restart",
        "argument": {
          "type": "select",
          "options": [
            "1"
          ]
        }
      },
      {
        "name": "Hostname",
        "argument": {
          "type": "text"

        }
      }
    ] satisfies Array<{ name: string, argument: NodeOptionTypes, flags?: Record<string, boolean> }>
  }
}



export type MQTTEvent = DiscoveryConfigEvent
