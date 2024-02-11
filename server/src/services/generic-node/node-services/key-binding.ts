import { ControlKeysWebsocket } from '../../../resources/control-keys.ws'
import type { DeviceConfig } from '../../mqtt-tasmota'
import { addTypeImpl } from '../generic-node-service'
import type { ElementNode, ExtendedJsonSchema } from '../typing/generic-node-type'
import { generateDtsFromSchema } from '../json-schema-type-util'
import type { NodeEvent } from '../node-event'


addTypeImpl({
  process(node: ElementNode<{ board?: string, key?: string, mode?: "press" | "release" }>, evt: NodeEvent<{ board: string, device?: DeviceConfig }>, callbacks) {
    if (!node?.parameters?.board) {
      return
    }
    node.runtimeContext ??= {}

    let prevBoardData: Array<string> = []
    if (node.runtimeContext.lastEvent) {
      const lEvt = node.runtimeContext.lastEvent as { payload: { data: { [board: string]: Array<string> } } }
      prevBoardData = lEvt.payload.data[node?.parameters?.board]
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
        type: "select",
        options: Object.keys(ControlKeysWebsocket.key_cache?.data ?? {})
      },
      key: {
        type: "text"
      },
      mode: {
        type: "select",
        options: ["press", "release"] as const,
      }
    }
  }),
  async nodeChanged(node) {
    if (!node.parameters?.board) {
      node.parameters ??= {}
      node.parameters.board = Object.keys(ControlKeysWebsocket.key_cache?.data ?? {})[0]
    }
    if (!node.runtimeContext?.inputSchema) {
      node.runtimeContext ??= {}

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
        debugger

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

    if (node.parameters?.board) {
      node.runtimeContext ??= {}
      node.runtimeContext.info = node.parameters?.board
      if (node.parameters.key) {
        node.runtimeContext.info = `${node.parameters?.board} - ${node.parameters?.key}`
      }
    }
    if (node.parameters.key && node.parameters.key != node.parameters.key.toUpperCase()) {
      node.parameters.key = node.parameters.key.toUpperCase()
    }
  },
})