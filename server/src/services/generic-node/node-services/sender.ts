import { addTypeImpl } from '../generic-node-service'
import { Sender } from '../../../models/sender';
import type { Transformation } from '../../../models/transformation';
import { updateRuntimeParameter } from '../element-node-fnc';
import { senderLoader } from '../../sender-loader';
import { genericNodeDataStore } from '../generic-store/reference';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { generateDtsFromSchema, generateJsonSchemaFromDts } from '../json-schema-type-util';
import { logKibana } from '../../../util/log';
import { load } from 'hibernatets';


function getHistoryCount(transformer: Transformation & { historyCount?: number }, events: Sender['events']) {

  transformer.historyCount = events?.filter((event: Sender['events'][number] & { parsedData?: { message?: string } }) => {
    if (!event.parsedData) {
      event.parsedData = JSON.parse(event.data);
    }
    return event.parsedData?.message === transformer.transformationKey;
  }).length;
  return transformer.historyCount;

}

addTypeImpl({
  context_type: (t: { deviceKey: string, transformation?: string, transformationCount: number }) => t,
  payload_type: (p: { message?: string, type?: "url" | "barcode", url?: string }) => p,
  async process(node, evt, callbacks) {

    if (!node.parameters?.deviceKey) {
      return
    }

    const needsTransformation = !!evt.context.transformationCount

    const type = node.parameters.type ?? "barcode"
    const evtType = evt.payload.type ?? "barcode"


    if (type !== evtType) {
      return
    }

    if (!evt.payload.message && evtType == "barcode") {
      return
    }
    if (!evt.payload.url && evtType == "url") {
      return
    }
    if (node.parameters?.deviceKey != evt.context.deviceKey) {
      return
    }
    if (needsTransformation) {
      if (!node.parameters.transformation) {
        return
      }
      if (!node.parameters?.transformation.includes(` (${evt.payload.message})`)) {
        return
      }
    }

    evt.context.transformation = node.parameters?.transformation?.replace(` (${evt.payload.message})`, "")
    callbacks.continue(evt)
  },
  nodeDefinition: () => ({
    outputs: 1,
    type: "sender",
    options: {
      deviceKey: {
        type: "placeholder",
        of: "select",
        invalidates: ["transformation"],
        order: 3
      },
      type: {
        type: "placeholder",
        of: "select",
        order: 2
      },
      transformation: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  async nodeChanged(node, prev) {

    const senders = await senderLoader.loadSenders()
    const deviceKeys = senders.map(dev => dev.deviceKey)

    updateRuntimeParameter(node, "deviceKey", {
      type: "select",
      options: deviceKeys,
      order: 3
    })

    if (node.parameters?.deviceKey) {
      const oneMonthsAgo = Date.now() - (1000 * 60 * 60 * 24 * 30);
      const senders = await load(Sender, {
        filter: s => s.deviceKey = node.parameters.deviceKey,
        options: {
          deep: {
            events: "`timestamp` > " + oneMonthsAgo,
            transformation: "TRUE=TRUE"
          }
        }
      })
      const sender = senders[0]
      const envtsCopy = [...sender.events]
      const transformations = sender?.transformation.sort((tr1, tr2) => {
        return getHistoryCount(tr2, envtsCopy) - getHistoryCount(tr1, envtsCopy);
      })?.filter(t => t.name?.length && t.transformationKey?.length)
        ?.map(t => `${t.name} (${t.transformationKey})`)
        ?.filter(n => n?.length) ?? []
      updateRuntimeParameter(node, "transformation", {
        type: "select",
        options: transformations
      })
      //


      const nodeRef = node;
      if (sender.schema) {
        const schema = JSON.parse(sender.schema)

        const dtsSchema = await generateDtsFromSchema(schema, `${node.type}-${node.uuid} -node schemagen`, {
          distinctRootOneOf: true
        });

        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputSchema({
          nodeUuid: node.uuid,
          schema: {
            jsonSchema: schema,
            dts: dtsSchema,
            mainTypeName: "Main",
          },
        }))

        try {
          const TypeDts = `
        ${dtsSchema}
        
        export type TypePropType=Main["type"]
        `;
          const typeProp = generateJsonSchemaFromDts(TypeDts, "TypePropType", `${node.type}-${node.uuid}-node yperesolution`)
          console.log(typeProp);
          if (typeProp && typeProp.type == "string" && "enum" in typeProp) {
            updateRuntimeParameter(nodeRef, "type", {
              type: "select",
              options: typeProp.enum! as Array<string>,
              order: 2
            })
            if (!node.parameters.type) {
              genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateParam({
                node: node.uuid,
                param: "type",
                value: "barcode"
              }))
            } else {
              generateJsonSchemaFromDts(TypeDts, "TypePropTypeMerged", `${node.type}-${node.uuid}-node yperesolution`)
            }
          } else {
            updateRuntimeParameter(nodeRef, "type", {
              type: "placeholder",
              of: "select"
            })
          }


        } catch (e) {
          logKibana("WARN", {
            message: "error during resolution of 'type' subprop",
            dts: dtsSchema
          }, e)
          updateRuntimeParameter(nodeRef, "type", {
            type: "placeholder",
            of: "select"
          })
        }
      } else {
        updateRuntimeParameter(nodeRef, "type", {
          type: "placeholder",
          of: "select"
        })
      }
    }




    if (node.parameters.transformation) {
      node.runtimeContext.info = `${node.parameters?.deviceKey} - ${node.parameters.transformation.split("(")[0]}`
    }
  }
})
