import { globalMqttConfig } from './mqtt-global'
import { mqttConnection } from '../../mqtt-api'
import { addTypeImpl } from '../generic-node-service'
import type { ElementNode, ExtendedJsonSchema, Select } from '../generic-node-type'
import { generateDtsFromSchema, generateZodTypeFromSchema } from '../json-schema-type-util'
import { connect } from 'mqtt'


addTypeImpl({
  async process(node: ElementNode<{ topic?: string, command?: string, argument?: string }>, evt, callbacks) {

    const topic = node?.parameters?.topic
    if (!topic) {
      return
    }
    const command = node?.parameters?.command
    if (!command) {
      return
    }

    if (!evt.globalConfig?.mqtt_server) {
      console.error("missing global")
      return
    }
    const client = connect(evt.globalConfig.mqtt_server)

    let argument = node.parameters?.argument
    if (argument == "<payload>" && typeof evt.payload == "string" && node.runtimeContext.inputSchema?.jsonSchema) {
      const zodValidator = await generateZodTypeFromSchema(node.runtimeContext.inputSchema?.jsonSchema)
      const newPayload = zodValidator.parse(evt.payload)
      argument = newPayload
    }

    if (argument == undefined) {
      return
    }
    const argStr = argument

    const finalTopic = `${topic}${command}`

    client.on("connect", () => {
      console.log(`sending ${argStr} to ${finalTopic}`)
      client.publish(finalTopic, argStr, async () => {
        await new Promise(res => setTimeout(res, 1000))
        client.endAsync()
      })
    })
    console.log("sending mqtt event", evt.payload)
    callbacks.continue(evt)
  },
  nodeDefinition: () => ({
    inputs: 1,
    type: "mqtt publish",
    options: {
      topic: {
        type: "select",
        options: mqttConnection.getPublishable()
      },
      command: {
        type: "placeholder",
        of: "select"
      },
      argument: {
        type: "placeholder",
        of: "select"
      }
    },
    globalConfig: globalMqttConfig
  }),
  async nodeChanged(node, prev) {
    if (node.parameters?.topic) {
      const device = mqttConnection.getDevice(node.parameters?.topic)
      node.runtimeContext ??= {}
      node.runtimeContext.info = device.friendlyName
      if (device.commands) {
        node.runtimeContext.parameters ??= {}

        const commandOtpinos = device.commands.map(c => c.name)
        node.runtimeContext.parameters["command"] = { type: "select", options: commandOtpinos }
        if (node.parameters.command == undefined) {
          node.parameters.command = commandOtpinos[0]
        }
        if (node.parameters?.command) {
          const command = device.commands.find(c => c.name == node.parameters?.command)
          if (command?.argument) {
            const cmdArg = command.argument as Select
            node.runtimeContext.parameters["argument"] = {
              type: "select",
              options: [...cmdArg.options, "<payload>"]
            }

            if (node.parameters.argument == undefined) {
              node.parameters.argument = cmdArg.options[0]
            } else {
              node.runtimeContext.info = `${device.friendlyName} - ${node.parameters.command} - ${node.parameters.argument}`
              if (node.parameters.argument === "<payload>") {
                const jsonSchema: ExtendedJsonSchema = {
                  type: "string",
                  enum: [...cmdArg.options]
                }
                node.runtimeContext.inputSchema = {
                  jsonSchema: jsonSchema,
                  dts: await generateDtsFromSchema(jsonSchema)
                }
              } else {
                delete node.runtimeContext.inputSchema
              }
            }
          }
        }

        if (prev?.parameters?.command && prev?.parameters?.command != node.parameters?.command) {
          delete node.parameters.argument
        }
      }

    }
  }
})


//export const mqttPub: TypeImplementaiton<{ topic: string, command: string, argument?: string }> = 