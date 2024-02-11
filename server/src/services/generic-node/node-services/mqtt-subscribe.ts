import { mqttConnection } from '../../mqtt-api'
import type { DeviceConfig } from '../../mqtt-tasmota'
import type { ElementNode, TypeImplementaiton } from '../generic-node-type'
import type { NodeEvent } from '../node-event'

export const mqttSub: TypeImplementaiton<{ topic: string }> = {
  process(node: ElementNode<{ topic?: string }>, evt: NodeEvent<{ topic: string, device?: DeviceConfig }>, callbacks) {
    if (!node?.parameters?.topic) {
      return
    }
    if (node?.parameters?.topic === evt.context.topic) {
      node.runtimeContext ??= {}
      if (!node.runtimeContext?.info && evt.context?.device) {

        node.runtimeContext.info = evt.context?.device.friendlyName
        callbacks.updateNode()
      }
      node.runtimeContext.lastEvent = evt
      callbacks.continue(evt)
    }
  },
  nodeDefinition: () => ({
    outputs: 1,
    type: "mqtt subscribe",
    options: {
      topic: {
        type: "select",
        options: mqttConnection.getSubscribable()
      }
    }
  }),
  nodeChanged(node) {
    if (node.parameters?.topic) {
      const device = mqttConnection.getDevice(node.parameters?.topic)
      node.runtimeContext ??= {}
      node.runtimeContext.info = device.friendlyName

    }
  },
}