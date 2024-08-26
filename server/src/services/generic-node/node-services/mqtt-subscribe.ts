import { mqttConnection } from '../../mqtt-api'
import type { DeviceConfig } from '../../mqtt-tasmota'
import type { ElementNode } from '../typing/element-node'
import type { NodeEvent } from '../node-event'
import { addTypeImpl } from '../generic-node-service'
import { updateRuntimeParameter } from '../element-node-fnc'




addTypeImpl({
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
      callbacks.continue(evt)
    }
  },
  nodeDefinition: () => ({
    outputs: 1,
    type: "mqtt subscribe",
    options: {
      topic: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  nodeChanged(node) {
    const subscribableDevices = mqttConnection.getSubscribable()
    updateRuntimeParameter(node, "topic", {
      type: "select",
      options: subscribableDevices.map(dev => dev.getTelemetry()),
      optionDisplayNames: subscribableDevices.map(dev => `${dev.friendlyName}`)
    })


    if (node.parameters?.topic) {
      const device = subscribableDevices.find(dev => dev.getTelemetry() === node.parameters.topic)

      if (device) {

        node.runtimeContext.info = device.friendlyName
      }
    }
  },
})