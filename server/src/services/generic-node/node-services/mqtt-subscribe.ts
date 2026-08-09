import { mqttConnection } from '../../mqtt-api'
import { addTypeImpl } from '../generic-node-service'
import { updateRuntimeParameter } from '../element-node-fnc'
import { genericNodeDataStore } from '../generic-store/reference'
import { backendToFrontendStoreActions } from '../generic-store/actions'




addTypeImpl({
  context_type() {
    return {
      type: "object",
      properties: {
        topic: {
          type: "string"
        },
        device: {
          type: "object",
          properties: {
            friendlyName: {
              type: "string"
            },
          }
        },

      }
    } as const
  },
  process(node, evt, callbacks) {
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

        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateRuntimeInfo({
          info: `${device.friendlyName}`,
          nodeUuid: node.uuid
        }))
      }
    }
  },
})