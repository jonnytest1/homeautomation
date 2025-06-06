import { addTypeImpl } from '../generic-node-service'
import { Receiver } from '../../../models/receiver'
import { generateJsonSchemaFromDts } from '../json-schema-type-util'
import { TscCompiler, tscConnectionInterfaceAndGlobals } from '../../../util/tsc-compiler'
import { ReceiverData } from '../../../models/receiver-data'
import type { ConnectionResponse } from '../../../models/connection-response'
import type { ElementNodeImpl } from '../element-node'
import { genericNodeDataStore } from '../generic-store/reference'
import { backendToFrontendStoreActions } from '../generic-store/actions'
import { updateRuntimeParameter } from '../element-node-fnc'
import { logKibana } from '../../../util/log'
import { sharedPool } from '../../../models/db-state'
import { SqlCondition, load } from 'hibernatets'
import type { ZodType } from 'zod'
import * as z from "zod";

export const DelayedSenderResponseSoundTypeNotificationDataSoundTypeSchema = z.object({
  "nestedObject": z.union([z.object({
    "attributes": z.union([z.object({
      "messageId": z.union([z.null(), z.string()]).optional(),
    }), z.null()]).optional(),
    "notification": z.union([z.lazy(() => NotificationDataSoundTypeSchema), z.null()]).optional(),
    "promise": z.union([z.lazy(() => DelayedSenderResponseSoundTypeNotificationDataSoundTypeSchema), z.null()]).optional(),
    "read": z.union([z.object({
      "text": z.union([z.null(), z.string()]).optional(),
    }), z.null()]).optional(),
  }), z.null()]).optional(),
  "sentData": z.any().optional(),
  "time": z.union([z.number(), z.null()]).optional(),
});


export const NotificationDataSoundTypeSchema = z.object({
  "body": z.union([z.null(), z.string()]).optional(),
  "sound": z.union([z.array(z.string()), z.null(), z.string()]).optional(),
  "title": z.union([z.null(), z.string()]).optional(),
});


export const ConnectionSchema = z.object({
  "attributes": z.union([z.object({
    "messageId": z.union([z.null(), z.string()]).optional(),
  }), z.null()]).optional(),
  "error": z.union([z.number(), z.null()]).optional(),
  "notification": z.union([NotificationDataSoundTypeSchema, z.null()]).optional(),
  "promise": z.union([DelayedSenderResponseSoundTypeNotificationDataSoundTypeSchema, z.null()]).optional(),
  "read": z.union([z.object({
    "text": z.union([z.null(), z.string()]).optional(),
  }), z.null()]).optional(),
  "response": z.union([z.record(z.string(), z.any()), z.null()]).optional(),
  "status": z.union([z.number(), z.null()]).optional(),
  "withRequest": z.union([z.boolean(), z.null()]).optional(),
});



const schemaMap: Record<string, {
  zodSchema: ZodType,
}> = {}

const deviceKeyArraySchema = z.array(z.string())



addTypeImpl({
  async process(node, evt, callbacks) {
    const params = node.parameters

    const deviceKey = params?.deviceKey
    if (deviceKey?.length) {
      const receiver = await load(Receiver, r => r.deviceKey = deviceKey, [], {
        first: true,
        deep: ["actions", "events"],
        db: sharedPool

      });

      const data = ConnectionSchema.parse(evt.payload)
      await receiver.send(new ReceiverData(data as ConnectionResponse))
    } else if (params?.deviceList?.length) {
      const devices = deviceKeyArraySchema.parse(JSON.parse(params?.deviceList))
      const receivers = await load(Receiver, SqlCondition.ALL, [], {
        deep: ["actions", "events"],
        db: sharedPool
      });

      const selected = receivers.filter(rec => devices.includes(rec.deviceKey))
      const data = ConnectionSchema.parse(evt.payload)
      const receiverData = new ReceiverData(data as ConnectionResponse)
      await Promise.all(selected.map(async rec => {
        try {
          await rec.send(receiverData)
        } catch (e) {
          logKibana("ERROR", "exception sending data to receiver", e)
        }
      }))

    }

    callbacks.continue(evt)
  },
  nodeDefinition: () => ({
    inputs: 1,
    type: "receiver",
    options: {
      deviceKey: {
        type: "placeholder",
        of: "select",
        invalidates: ["action"]
      },
      action: {
        type: "placeholder",
        of: "select"
      },
      deviceList: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  async nodeChanged(node, prev) {

    const receivers = await load(Receiver, SqlCondition.ALL, [], {
      deep: ["actions", "events"]
    });
    const deviceKeys = receivers.map(dev => dev.deviceKey)
    deviceKeys.unshift("")

    updateRuntimeParameter(node, "deviceKey", {
      type: "select",
      options: deviceKeys
    })

    if (!node.runtimeContext.inputSchema) {
      computeTypeSchema(node)
    }

    if (!node.parameters.deviceKey) {
      updateRuntimeParameter(node, "deviceList", {
        type: "select",
        options: receivers.map(dev => dev.deviceKey),
        multiple: true
      }, receivers.map(dev => dev.deviceKey))
    } else {
      updateRuntimeParameter(node, "deviceList", {
        type: "placeholder",
        of: "select"
      }, deviceKeys)
    }

  }
})

async function computeTypeSchema(node: ElementNodeImpl) {
  if (!TscCompiler.responseINterface) {
    throw new Error("response interface not yet laoded")
  }

  const tsc = tscConnectionInterfaceAndGlobals()
  const schema = generateJsonSchemaFromDts(`

export {};

  ${tsc.interfaces}

`, "ConnectionResponse", `${node.type}-${node.uuid}-input gen for receiver`)

  const conI = tscConnectionInterfaceAndGlobals()

  genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputSchema({
    nodeUuid: node.uuid,
    schema: {
      dts: `
      namespace ConnectionType {  
        ${conI.interfaces}
      }
      export type Main=ConnectionType.ConnectionResponse`,
      jsonSchema: schema,
      mainTypeName: "Main",
      globalModDts: conI.globals
    }
  }))

}