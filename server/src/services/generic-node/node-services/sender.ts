import { addTypeImpl } from '../generic-node-service'
import { Sender } from '../../../models/sender';
import type { Transformation } from '../../../models/transformation';
import { updateRuntimeParameter } from '../element-node-fnc';
import { senderLoader } from '../../sender-loader';


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
  payload_type: (p: { message?: string }) => p,
  async process(node, evt, callbacks) {

    if (!node.parameters?.deviceKey) {
      return
    }

    const needsTransformation = !!evt.context.transformationCount



    if (!evt.payload.message) {
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
        invalidates: ["transformation"]
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
      options: deviceKeys
    })

    if (node.parameters?.deviceKey) {
      const sender = senders.find(sender => sender.deviceKey === node.parameters?.deviceKey)
      const envtsCopy = [...sender?.events ?? []]
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
    }

    if (node.parameters.transformation) {
      node.runtimeContext.info = `${node.parameters?.deviceKey} - ${node.parameters.transformation.split("(")[0]}`
    }
  }
})
