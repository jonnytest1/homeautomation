
import mqtt from "mqtt"
import { ResolvablePromise } from '../../utils/resolvable-promise'
import {
  type TypeValue, type FunctionTypeLiteral, type VoidTypeLiteral, type StringTypeLiteral,
  type IntTypeLiteral, newClassBound, stringTypeLiteral, consumeFunction, type JscppInclude
} from 'electronics-lib'


export function mqttReplace(code: string): string {
  return code
    .replace(/client\.begin\(cli\);/g, "")
    .replace(/client\.loop\(\);/g, "")
    .replace(/mqtt\.fritz\.box/g, "localhost")
}

export function mqttLib() {


  let server: string
  let port: number

  let cli: mqtt.MqttClient

  let connected = new ResolvablePromise<boolean>()
  let callback: TypeValue<FunctionTypeLiteral<VoidTypeLiteral, StringTypeLiteral[]>>;

  let connectionMock = false
  let callct = 0
  return {
    "MQTT.h": {
      load: (rt) => {
        const pubSubCli = newClassBound<[]>(rt)("MQTTClient", [])
        rt.regFunc((rt, self, serverVar, portV) => {
          server = rt.getStringFromCharArray(serverVar)
          port = portV.v

        }, pubSubCli, "setHost", [stringTypeLiteral(rt), rt.intTypeLiteral], rt.voidTypeLiteral)

        rt.regFunc((rt, self, callbackV) => {
          callback = callbackV
        }, pubSubCli, "onMessage", [rt.functionType(rt.voidTypeLiteral, [stringTypeLiteral(rt), stringTypeLiteral(rt)])], rt.voidTypeLiteral)

        rt.regFunc((rt, self, idV, userV, passwdV) => {
          const user = rt.getStringFromCharArray(userV)
          const pwd = rt.getStringFromCharArray(passwdV)
          cli = mqtt.connect({
            host: server,
            protocol: location.protocol === "https:" ? "wss" : "ws",
            port: port,
            username: user,
            password: pwd,
          })

          cli.once("connect", () => {
            connected.resolve(true)

            cli.on("message", (t, data) => {
              if (callback) {
                const dataString = data.toString()
                try {
                  consumeFunction(rt, callback, [rt.makeCharArrayFromString(t), rt.makeCharArrayFromString(dataString), rt.val(rt.intTypeLiteral, dataString.length)])

                } catch (e) {
                  debugger
                }
              }
            })
          })

          cli.on("error", e => {
            debugger
          })
          return rt.val(rt.boolTypeLiteral, true)
        }, pubSubCli, "connect", [stringTypeLiteral(rt), stringTypeLiteral(rt), stringTypeLiteral(rt)], rt.boolTypeLiteral)

        rt.regFunc((rt, self) => {
          callct++;

          if (callct > 2) {
            connectionMock = true
          }
          return rt.val(rt.boolTypeLiteral, connectionMock)

        }, pubSubCli, "connected", [], rt.boolTypeLiteral)

        rt.regFunc((rt, self, topicV) => {
          const topic = rt.getStringFromCharArray(topicV)
          connected.then(() => {
            cli.subscribe(topic)
          })
        }, pubSubCli, "subscribe", [stringTypeLiteral(rt)], rt.voidTypeLiteral)

        rt.regFunc((rt, self, topicV, dataV) => {
          const topic = rt.getStringFromCharArray(topicV)
          const data = rt.getStringFromCharArray(dataV)
          connected.then(() => {
            console.log(topic, data)
            cli.publish(topic, data)
          })
          return rt.val(rt.boolTypeLiteral, true)
        }, pubSubCli, "publish", [stringTypeLiteral(rt), stringTypeLiteral(rt)], rt.boolTypeLiteral, [{ type: rt.boolTypeLiteral }, { type: rt.intTypeLiteral }] as any)
      }
    }
  } satisfies JscppInclude
}