import type { SocketMap } from './page-events'
import type { DeviceConfig } from '../../../mqtt-tasmota'
import type { ElementNodeImpl } from '../../element-node'
import { addTypeImpl } from '../../generic-node-service'
import { generateDtsFromSchema, mainTypeName } from '../../json-schema-type-util'
import { getLastEvent } from '../../last-event-service'
import type { TypeImplSocket } from '../../typing/generic-node-type'
import { getClient, globalMqttConfig } from '../mqtt-global'
import { updateRuntimeParameter } from '../../element-node-fnc'
import { createNodeEvent } from '../../generic-store/node-event-factory'
import { genericNodeDataStore } from '../../generic-store/reference'
import { backendToFrontendStoreActions } from '../../generic-store/actions'
import { z } from 'zod'
import { BehaviorSubject, firstValueFrom } from 'rxjs'
import type { MqttClient } from 'mqtt'
import type { ExtendedJsonSchema } from 'json-schema-merger'
import { join } from 'path'
import { readFile } from 'fs/promises'

let mqttConneciton: MqttClient;

const layoutType = z.record(z.array(z.array(z.string())))


const nodesMap: Record<string, ElementNodeImpl> = {}

const layoutSubject = new BehaviorSubject<z.infer<typeof layoutType>>({})

// { board?: string, key?: string, mode?: "press" | "release" }
addTypeImpl({
  context_type: (t: { board: string, device?: DeviceConfig }) => t,
  messageSocket(s: TypeImplSocket<SocketMap>) {
    s.subscribe((emit) => {

      if (emit.type === "layouts") {
        emit.___reply(layoutSubject.value)
      } else if (emit.type === "page-trigger") {
        const key = emit.key
        Object.values(nodesMap).forEach(node => {
          node.continue(createNodeEvent({
            context: {
              manualKey: true
            },
            payload: {
              type: "press",
              key: key
            }
          }))
        })
      } else {
        debugger;
      }
    })
  },
  process(node, evt, callbacks) {
    if (!node?.parameters?.board) {
      return
    }
    node.runtimeContext ??= {}

    let prevBoardData: Array<string> = []
    const lastEvent = getLastEvent<{ data: { [board: string]: Array<string> } }>(node)
    if (lastEvent) {
      prevBoardData = lastEvent.payload.data[node?.parameters?.board] ?? []
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

      } else if (!prevBoardData.includes(node.parameters.key) && newBoardData?.includes(node.parameters.key)) {
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
        options: ["press", "release", "both"] as const,
      }
    },
    globalConfig: globalMqttConfig,
    page: "./key-binding-page.html"
  }),
  async nodeChanged(node, prev) {
    nodesMap[node.uuid] = node
    const layouts = await firstValueFrom(layoutSubject)

    updateRuntimeParameter(node, "board", {
      type: "select",
      options: Object.keys(layouts),
      order: 2
    })
    if (!node.parameters?.board) {
      node.parameters.board = Object.keys(layouts)[0]
    }
    if (!node.runtimeContext?.outputSchema) {

      const keySchema: ExtendedJsonSchema = { "type": "string" }
      if (node.parameters.key) {
        keySchema.enum = [node.parameters.key]
      }
      let jsonSchema: ExtendedJsonSchema
      if (!node.parameters?.mode) {
        node.parameters.mode = "press"
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
        jsonSchema: jsonSchema,
        mainTypeName: mainTypeName,
        dts: await generateDtsFromSchema(jsonSchema, `${node.type}-${node.uuid}-node change`)
      }

      //TODO:

    }
    if (node.parameters.key && node.parameters.key != node.parameters.key.toUpperCase()) {
      node.parameters.key = node.parameters.key.toUpperCase()
    }

    const startInfo = node.runtimeContext.info
    let newInfo: string | undefined = undefined
    if (node.parameters?.board) {
      newInfo = node.parameters?.board

      const fileContent = await readFile(join(__dirname, "key-binding-property.html"), { encoding: "utf8" })

      updateRuntimeParameter(node, "key", {
        type: "iframe",
        document: fileContent,
        data: layouts[node.parameters?.board]
      })
      if (node.parameters.key) {
        newInfo = `${node.parameters?.board} - ${node.parameters?.key}`
      }
    }

    if (newInfo && newInfo !== startInfo) {
      genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateRuntimeInfo({
        nodeUuid: node.uuid,
        info: newInfo
      }))
    }

  },
  initializeServer(nodes, globals): void | Promise<void> {
    for (const node of nodes) {
      nodesMap[node.uuid] = node
    }

    if (globals.mqtt_server) {
      mqttConneciton = getClient(globals)
      mqttConneciton.on("message", (e, data) => {
        const evt = JSON.parse(data.toString())
        const parsedEvt = layoutType.parse(evt.layout)
        layoutSubject.next(parsedEvt)
      })
      mqttConneciton.subscribe("personal/discovery/key-sender/layout")
    }

  },
  unload(nodes, globals) {
    mqttConneciton?.end()
  },
})