import { TimerFactory } from '../../event/timer-factory';
import { ElementNodeImpl, updateRuntimeParameter } from '../element-node';
import { addTypeImpl } from '../generic-node-service';
import { generateDtsFromSchema, mainTypeName } from '../json-schema-type-util';
import { logKibana } from '../../../util/log';
import { NodeEvent } from '../node-event';
import { z } from 'zod';
import type { JSONSchema6 } from 'json-schema';

const delayUnits = ["seconds", "minutes", "hours", "<payload seconds>"] as const;


const payloadSchema = z.object({
  delay: z.number(),
  payload: z.optional(z.any())
})


const nodeRegister: Record<string, ElementNodeImpl> = {}

type EventData = {
  node: string,
  data: unknown
  context: unknown
}
export async function handleTimedEvent(data: EventData) {
  const node = nodeRegister[data.node]

  if (node) {
    console.info("reentry at timing");
    node.continue(new NodeEvent({
      payload: data.data,
      context: data.context
    }, {}))
  } else {
    logKibana("ERROR", {
      message: "node at timer handler doesnt exist",
      node: data.node
    })
  }
}



addTypeImpl({
  nodeDefinition: () => ({
    inputs: 1,
    outputs: 1,
    type: "timing",
    options: {
      type: {
        type: "select",
        options: ["schedule", "delay"] as const,
        "invalidates": ["delayUnit", "delay"]
      },

      delayUnit: {
        type: "placeholder",
        of: "select"
      },
      delay: {
        type: "placeholder",
        of: "number"
      }
    }
  }),
  process(node, evt, callbacks) {

    if (!node.parameters?.type) {
      return
    }

    if (node.parameters.type == "delay") {

      const duration = node.parameters.delayUnit as typeof delayUnits[number]

      let multiplier = 1

      let data = evt.payload

      if (duration === "seconds") {
        multiplier = 1
      } else if (duration === "minutes") {
        multiplier = 60
      } else if (duration === "hours") {
        multiplier = 60 * 60
      }

      let durationMillis: number | null = null
      if (duration === "<payload seconds>") {
        const payloadParam = payloadSchema.parse(data)
        const delay = payloadParam.delay;

        if (!isNaN(delay)) {
          durationMillis = delay * 1000
        }
        data = payloadParam.payload
      } else {
        const delay = node.parameters.delay;
        if (delay !== undefined && typeof delay === "string") {
          const num = +delay
          if (!isNaN(num)) {
            durationMillis = num * multiplier
          }
        }
      }

      if (durationMillis === null) {
        return
      }
      console.log("creating timer")


      const evtData: EventData = {
        node: node.uuid,
        data,
        context: evt.context
      }
      TimerFactory.createCallback("generic-event", {
        time: durationMillis,
        nestedObject: evtData,
        sentData: evt.payload
      })
    }
  },
  async nodeChanged(node, prevNode) {
    if (node.parameters?.type == "delay") {


      updateRuntimeParameter(node, "delayUnit", {
        type: "select",
        options: delayUnits
      })



      if (node.parameters.delayUnit == "<payload seconds>") {
        delete node.runtimeContext.parameters.delay

        const jsonSchema: JSONSchema6 = {
          type: "object",
          properties: {
            delay: {
              type: "number"
            },
            payload: {

            }
          },
          additionalProperties: false
        }
        node.runtimeContext.inputSchema = {
          jsonSchema: jsonSchema,
          mainTypeName: mainTypeName,
          dts: await generateDtsFromSchema(jsonSchema, `${node.type}-${node.uuid}-node change`)
        }

      } else {
        updateRuntimeParameter(node, "delay", {
          type: "number"
        }, 60)
      }

    }
  },
  async connectionTypeChanged(node, schema) {
    const schemaParsed = schema.jsonSchema
    const payloadProp = schemaParsed.properties?.payload
    if (payloadProp && typeof payloadProp == "object") {
      node.runtimeContext.outputSchema = {
        jsonSchema: payloadProp,
        mainTypeName: "Main",
        dts: await generateDtsFromSchema(payloadProp, `${node.type}-${node.uuid}-con change`)
      }
    }
  },

  initializeServer(nodes, globals) {
    for (const node of nodes) {
      nodeRegister[node.uuid] = node
    }
  },
  unload(nodeas, globals) {
    for (const key in nodeRegister) {
      delete nodeRegister[key]
    }
  },
})