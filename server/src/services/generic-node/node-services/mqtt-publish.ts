import { globalMqttConfig } from './mqtt-global'
import { mqttConnection } from '../../mqtt-api'
import { addTypeImpl } from '../generic-node-service'
import type { ExtendedJsonSchema } from '../typing/generic-node-type'
import { generateDtsFromSchema, generateZodTypeFromSchema, mainTypeName } from '../json-schema-type-util'
import type { Select } from '../typing/node-options'
import { connect } from 'mqtt'
import type { ZodType } from 'zod'


const zodValidators: Record<string, Promise<ZodType>> = {}

addTypeImpl({
  async process(node, evt, callbacks) {

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
      const zodValidator = await zodValidators[node.uuid]
      const newPayload = zodValidator.parse(evt.payload)
      argument = newPayload
    }

    if (argument === undefined) {
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
        type: "placeholder",
        of: "select"
      },
      command: {
        type: "placeholder",
        of: "select"
      },
      argument: {
        type: "placeholder",
        of: ["text", "select"]
      }
    },
    globalConfig: globalMqttConfig
  }),
  async nodeChanged(node, prev) {
    node.runtimeContext ??= {}
    node.runtimeContext.parameters ??= {}
    const publishable = mqttConnection.getPublishable()
    node.runtimeContext.parameters.topic = {
      type: "select",
      options: publishable.map(d => `${d.getCommandTopic()}`),
      optionDisplayNames: publishable.map(d => d.friendlyName),
      order: 2
    }

    if (node.parameters?.topic) {

      if (prev?.parameters?.topic && node.parameters?.topic !== prev?.parameters?.topic) {
        delete node.parameters.command
        delete node.parameters.argument
        delete node.runtimeContext.parameters?.argument
        delete node.runtimeContext.parameters?.command
      }

      const device = mqttConnection.getDevice(node.parameters?.topic)

      node.runtimeContext.info = device.friendlyName
      if (device.commands) {
        node.runtimeContext.parameters ??= {}

        const commandOtpinos = device.commands.map(c => c.name)
        node.runtimeContext.parameters["command"] = { type: "select", options: commandOtpinos }



        if (node.parameters.command == undefined) {
          node.parameters.command = commandOtpinos[0]
        }
        if (node.parameters?.command) {
          if (prev?.parameters?.command && node.parameters?.command !== prev?.parameters?.command) {
            delete node.parameters.argument
          }
          const command = device.commands.find(c => c.name == node.parameters?.command)
          if (command?.argument) {
            if (command.argument.type == "select") {
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
                    mainTypeName: mainTypeName,
                    dts: await generateDtsFromSchema(jsonSchema, `${node.type}-${node.uuid}-node change`)
                  }
                  zodValidators[node.uuid] = generateZodTypeFromSchema(jsonSchema)
                } else {
                  delete node.runtimeContext.inputSchema
                }
              }
            } else {
              node.runtimeContext.parameters["argument"] = command.argument as typeof node.runtimeContext.parameters["argument"]
            }


          } else {
            //use empty string for no argument command
            node.parameters.argument = ""
          }
        }


      }

    }
  }
})


//export const mqttPub: TypeImplementaiton<{ topic: string, command: string, argument?: string }> = 