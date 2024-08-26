import { getClient, globalMqttConfig } from './mqtt-global'
import { mqttConnection } from '../../mqtt-api'
import { addTypeImpl } from '../generic-node-service'
import type { ExtendedJsonSchema } from '../typing/generic-node-type'
import { generateDtsFromSchema, generateZodTypeFromSchema, mainTypeName } from '../json-schema-type-util'
import { type NodeOptionTypeWithName, type Select } from '../typing/node-options'
import { updateRuntimeParameter } from '../element-node'
import { logKibana } from '../../../util/log'
import { backendToFrontendStoreActions } from '../generic-store/actions'
import { genericNodeDataStore } from '../generic-store/reference'
import { argumentTypeToJsonSchema } from '../typing/node-optinon-to-json-schema'
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
    const client = getClient(evt.globalConfig)

    const config = mqttConnection.getDevice(topic)
    const commandObj = config.commands.find(cmd => cmd.name === command)


    let argument = node.parameters?.argument
    if (argument == "<payload>" && typeof evt.payload == "string" && node.runtimeContext.inputSchema?.jsonSchema) {
      const zodValidator = await zodValidators[node.uuid]
      const newPayload = zodValidator.parse(evt.payload)
      argument = newPayload
    }

    if (argument === undefined && !(commandObj?.argument instanceof Array)) {
      return
    }
    let argStr = argument

    const waitingforResponse = config?.sendsResponse() || commandObj?.responses
    if (waitingforResponse) {
      const mqttEvt: { timestamp: number, argument?: string } = { timestamp: Date.now() }
      if (typeof argument === "string") {
        mqttEvt.argument = argument
      } else if (typeof argument === "object") {
        Object.assign(mqttEvt, argument)
      } else {
        logKibana("ERROR", { message: "invalid argument for response", argument })
      }

      if (commandObj?.argument instanceof Array) {
        for (const arg of commandObj.argument) {
          mqttEvt[arg.name] = evt.payload?.[arg.name] ?? node.parameters?.[arg.name]
        }
      }
      argStr = JSON.stringify(mqttEvt)

      const responseTopic = `response/${config.mqttDeviceName}/${command}/${mqttEvt.timestamp}`
      client.subscribe(responseTopic, (e, grants) => {
        if (e) {
          debugger
        }
      })

      client.on("message", (topic, msg) => {
        if (topic === responseTopic) {
          const payload = {
            response: `${msg.toString()}`
          }

          try {
            const responseEvt = JSON.parse(payload.response)
            if ("response" in responseEvt) {
              Object.assign(payload, responseEvt)
            }
          } catch (e) {
            //
          }

          evt.updatePayload(payload)
          callbacks.continue(evt)
          client.unsubscribe(responseTopic)
          client.endAsync()
        }
      })
    }



    const finalTopic = `${topic}${command}`
    const finalArgStr = argStr
    if (finalArgStr === undefined) {
      return
    }

    client.on("connect", () => {
      console.log(`sending ${finalArgStr} to ${finalTopic}`)


      client.publish(finalTopic, finalArgStr, {
        retain: commandObj?.asyncRetained || false
      }, async (err, msg) => {
        await new Promise(res => setTimeout(res, 1000))
        if (!waitingforResponse) {
          callbacks.continue(evt)
          client.endAsync()
        }
      })
    })
    console.log("sending mqtt event", evt.payload)
  },
  nodeDefinition: () => ({
    inputs: 1,
    outputs: 1,
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
    const publishable = mqttConnection.getPublishable()

    updateRuntimeParameter(node, "topic", {
      type: "select",
      options: publishable.map(d => `${d.getCommandTopic()}`),
      optionDisplayNames: publishable.map(d => d.friendlyName),
      order: 2
    })

    if (node.parameters.topic) {

      if (prev?.parameters?.topic && node.parameters.topic !== prev?.parameters?.topic) {
        delete node.parameters.command
        delete node.parameters.argument
        delete node.runtimeContext.parameters?.argument
        delete node.runtimeContext.parameters?.command
      }

      const device = mqttConnection.getDevice(node.parameters?.topic)

      node.runtimeContext.info = device.friendlyName
      if (device.commands) {
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

          let isSingleArgument = true
          if (command?.argument) {
            let args: Array<NodeOptionTypeWithName> = []

            if (command.argument instanceof Array) {
              args = command.argument

              if (!command.argument.some(arg => arg.name === "argument")) {

                updateRuntimeParameter(node, "argument", {
                  type: "select",
                  options: ["<payload>", "hardcoded"],
                  order: 3
                })
                isSingleArgument = false
              }

            } else {
              const cmdArg = {
                name: "argument",
                ...command.argument
              }

              args = [cmdArg]
            }

            const inputSchema: ExtendedJsonSchema = {
              type: "string"
            }
            if (!isSingleArgument) {
              inputSchema.type = "object"
            }

            for (const commandArgument of args) {
              if (commandArgument.type == "select") {
                const cmdArg = commandArgument as Select
                node.runtimeContext.parameters[commandArgument.name] = {
                  type: "select",
                  options: [...cmdArg.options, "<payload>"]
                }

                if (node.parameters[commandArgument.name] == undefined) {
                  node.parameters[commandArgument.name] = cmdArg.options[0]
                } else {
                  node.runtimeContext.info = `${device.friendlyName} - ${node.parameters.command} - ${node.parameters[commandArgument.name]}`
                }
              } else {

                node.runtimeContext.parameters[commandArgument.name] = commandArgument as typeof node.runtimeContext.parameters["argument"]
              }

              inputSchema.properties ??= {}
              inputSchema.properties[commandArgument.name] = argumentTypeToJsonSchema(commandArgument)

            }

            if (node.parameters.argument === "<payload>") {


              //allRequired(inputSchema)

              const inputSchemaObj = {
                jsonSchema: inputSchema,
                mainTypeName: mainTypeName,
                dts: await generateDtsFromSchema(inputSchema, `${node.type}-${node.uuid}-node change`)
              } as const
              /**
               * @deprecated but overwritten by update after change use updateInputSchema
               */
              node.runtimeContext.inputSchema = inputSchemaObj


              genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputSchema({
                nodeUuid: node.uuid,
                schema: inputSchemaObj
              }))
              zodValidators[node.uuid] = generateZodTypeFromSchema(inputSchema)
            } else {
              delete node.runtimeContext.inputSchema
            }

          } else {
            //use empty string for no argument command
            node.parameters.argument = ""
          }
        }


      }


      if (device.sendsResponse()) {
        const responseType: ExtendedJsonSchema = {
          type: "string"
        }
        if (node.parameters.command) {
          const command = device.commands.find(c => c.name == node.parameters?.command)
          if (command?.responses) {
            responseType.enum = command.responses
          }
        }
        const jsonSchema: ExtendedJsonSchema = {
          type: "object",
          properties: {
            response: responseType
          },
          required: ["response"]
        }
        node.runtimeContext.outputSchema = {
          jsonSchema: jsonSchema,
          mainTypeName: "Main",
          dts: await generateDtsFromSchema(jsonSchema, `${node.type}-${node.uuid}-node response`)
        }
      }
    }
  }
})


//export const mqttPub: TypeImplementaiton<{ topic: string, command: string, argument?: string }> = 