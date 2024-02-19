import { globalMqttConfig } from './mqtt-global'
import type { DeviceConfig } from '../../mqtt-tasmota'
import { addTypeImpl } from '../generic-node-service'
import type { ElementNode, ExtendedJsonSchema } from '../typing/generic-node-type'
import { generateDtsFromSchema } from '../json-schema-type-util'
import { getLastEvent } from '../last-event-service'
import { updateRuntimeParameter } from '../element-node'
import { MqttClient, connect } from 'mqtt'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import { z } from 'zod'
import { readFile } from 'fs/promises'
import { join } from 'path'


let mqttConneciton: MqttClient;

const layoutType = z.record(z.array(z.array(z.string())))



const layoutSubject = new BehaviorSubject<z.infer<typeof layoutType>>({})

addTypeImpl({
  context_type: (t: { board: string, device?: DeviceConfig }) => t,
  process(node: ElementNode<{ board?: string, key?: string, mode?: "press" | "release" }>, evt, callbacks) {
    if (!node?.parameters?.board) {
      return
    }
    node.runtimeContext ??= {}

    let prevBoardData: Array<string> = []
    const lastEvent = getLastEvent<{ data: { [board: string]: Array<string> } }>(node)
    if (lastEvent) {
      prevBoardData = lastEvent.payload.data[node?.parameters?.board]
    }
    const newEvt = evt.payload as { data: { [board: string]: Array<string> } }
    const newBoardData = newEvt.data[node?.parameters?.board]
    if (node.parameters.key) {
      if (prevBoardData.includes(node.parameters.key) && !newBoardData.includes(node.parameters.key)) {
        if (node.parameters.mode !== "press") {

          evt.updatePayload({
            type: "release",
            key: node.parameters.key

          })
          callbacks.continue(evt)
        }

      } else if (!prevBoardData.includes(node.parameters.key) && newBoardData.includes(node.parameters.key)) {
        if (node.parameters.mode !== "release") {
          evt.updatePayload({
            type: "press",
            key: node.parameters.key

          })
          callbacks.continue(evt)
        }
      }
    }
  },
  nodeDefinition: () => ({
    outputs: 1,
    type: "key binding",
    options: {
      board: {
        type: "placeholder",
        of: "select",
        invalidates: ["key"]
      },
      key: {
        type: "placeholder",
        "of": "iframe"
      },
      mode: {
        type: "select",
        options: ["press", "release"] as const,
      }
    },
    globalConfig: globalMqttConfig
  }),
  async nodeChanged(node, prev) {

    const layouts = await firstValueFrom(layoutSubject)

    updateRuntimeParameter(node, "board", {
      type: "select",
      options: Object.keys(layouts),
      order: 2
    })
    if (!node.parameters?.board) {
      node.parameters.board = Object.keys(layouts)[0]
    }
    if (!node.runtimeContext?.inputSchema) {

      const keySchema: ExtendedJsonSchema = { "type": "string" }
      if (node.parameters.key) {
        keySchema.enum = [node.parameters.key]
      }
      let jsonSchema: ExtendedJsonSchema
      if (!node.parameters?.mode) {
        jsonSchema = {
          "anyOf": [
            {
              "type": "object",
              required: ["type", "key"],
              additionalProperties: false,
              "properties": {
                "type": { "type": "string", "const": "release" },
                "key": keySchema
              }
            },
            {
              "type": "object",
              additionalProperties: false,
              required: ["type", "key"],
              "properties": {
                "type": { "type": "string", "const": "press" },
                "key": keySchema
              }
            }],
          "$schema": "http://json-schema.org/draft-07/schema#"
        }

      } else if (node.parameters.mode == "press") {
        jsonSchema = {
          "type": "object",
          additionalProperties: false,
          required: ["type", "key"],
          "properties": {
            "type": { "type": "string", "const": "press" },
            "key": keySchema
          }
        }
      } else if (node.parameters.mode == "release") {
        jsonSchema = {
          "type": "object",
          required: ["type", "key"],
          additionalProperties: false,
          "properties": {
            "type": { "type": "string", "const": "release" },
            "key": keySchema
          }
        }
      } else {
        debugger
        throw new Error("new case ?")
      }
      node.runtimeContext.outputSchema = {
        jsonSChema: jsonSchema,
        dts: await generateDtsFromSchema(jsonSchema)
      }

      //TODO:

    }
    if (node.parameters.key && node.parameters.key != node.parameters.key.toUpperCase()) {
      node.parameters.key = node.parameters.key.toUpperCase()
    }

    if (node.parameters?.board) {
      node.runtimeContext.info = node.parameters?.board

      const fileContent = await readFile(join(__dirname, "key-binding-property.html"), { encoding: "utf8" })

      node.runtimeContext.parameters.key = {
        type: "iframe",
        document: fileContent,
        data: layouts[node.parameters?.board]
      }

      if (node.parameters.key) {
        node.runtimeContext.info = `${node.parameters?.board} - ${node.parameters?.key}`
      }
    }

  },
  initializeServer(node, globals): void | Promise<void> {
    if (globals.mqtt_server) {
      mqttConneciton = connect(globals.mqtt_server)
      mqttConneciton.on("message", (e, data) => {
        const evt = JSON.parse(data.toString())
        const parsedEvt = layoutType.parse(evt.layout)
        layoutSubject.next(parsedEvt)
      })
      mqttConneciton.subscribe("personal/discovery/key-sender/layout")
    }

  },
  unload(nodeas, globals) {
    mqttConneciton?.end()
  },
})