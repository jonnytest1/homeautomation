import { addTypeImpl } from '../generic-node-service'
import { Sender } from '../../../models/sender';
import type { Transformation } from '../../../models/transformation';
import type { NodeEvent } from '../node-event';
import { SqlCondition, load } from 'hibernatets';


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
  async process(node, evt: NodeEvent<{ deviceKey: string }, { message: string }>, callbacks) {
    if (!node.parameters?.deviceKey || !node.parameters.transformation) {
      return
    }
    if (!evt.payload.message) {
      return
    }
    if (node.parameters?.deviceKey != evt.context.deviceKey) {
      return
    }
    if (!node.parameters?.transformation.includes(` (${evt.payload.message})`)) {
      return
    }


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

    const senders = await load(Sender, SqlCondition.ALL, [], {
      deep: ["transformation", "events"]
    });
    const deviceKeys = senders.map(dev => dev.deviceKey)

    node.checkInvalidations(this, prev);
    node.updateRuntimeParameter("deviceKey", {
      type: "select",
      options: deviceKeys
    })
    node.runtimeContext.parameters ??= {}

    if (node.parameters?.deviceKey) {
      const sender = senders.find(sender => sender.deviceKey === node.parameters?.deviceKey)
      const envtsCopy = [...sender?.events ?? []]
      const transformations = sender?.transformation.sort((tr1, tr2) => {
        return getHistoryCount(tr2, envtsCopy) - getHistoryCount(tr1, envtsCopy);
      })?.filter(t => t.name?.length && t.transformationKey?.length)
        ?.map(t => `${t.name} (${t.transformationKey})`)
        ?.filter(n => n?.length) ?? []
      node.updateRuntimeParameter("transformation", {
        type: "select",
        options: transformations
      })
      //
    }
  }
})
