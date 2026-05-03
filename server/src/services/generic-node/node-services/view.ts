import type { ElementNodeImpl } from '../element-node';
import { updateRuntimeParameter } from '../element-node-fnc';
import { addTypeImpl, emitFromNode } from '../generic-node-service';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { createNodeEvent } from '../generic-store/node-event-factory';
import { genericNodeDataStore } from '../generic-store/reference';
import { selectNodeByUuid, selectViewNodesByView } from '../generic-store/selectors';
import { nestedCallTrace } from '../node-trace';


const inputMap: Record<string, Array<ElementNodeImpl>> = {}


addTypeImpl({
  nodeDefinition: () => ({
    type: "view",
    inputs: 1,
    outputs: 0,
    options: {
      type: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  process(node, data, callbacks) {
    if (node.parameters?.type == "collection") {

      const viewNodes = genericNodeDataStore.getOnce(selectViewNodesByView(node.uuid))
      const inputs = viewNodes.filter(node => node.parameters?.type == "view-input")

      for (const input of inputs) {
        const event = createNodeEvent(data)


        emitFromNode(input.uuid, event, 0, nestedCallTrace(input, callbacks.trace, "impliedFromViewInput"))
      }
    } else if (node.parameters?.type == "view-output" && node.view) {
      const event = createNodeEvent(data)
      const viewNode = genericNodeDataStore.getOnce(selectNodeByUuid(node.view))
      emitFromNode(node.view, event, 0, nestedCallTrace(viewNode, callbacks.trace, "impliedForViewOutput"))
    }
  },
  nodeChanged(node, prevNode) {
    node.runtimeContext ??= {}
    if (node.view) {
      updateRuntimeParameter(node, "type", {
        type: "select",
        options: ["collection", "view-input", "view-output"]
      })
    } else {
      updateRuntimeParameter(node, "type", {
        type: "select",
        options: ["collection"]
      })
    }

    if (node.parameters?.type == "collection") {
      if (node.runtimeContext.inputs !== 1) {
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputs({
          nodeUuid: node.uuid,
          inputs: 1
        }))
      }
      if (node.runtimeContext.outputs !== 1) {
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputs({
          nodeUuid: node.uuid,
          outputs: 1
        }))
      }
    } else if (node.parameters?.type == "view-input") {
      if (node.runtimeContext.inputs !== 0) {
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputs({
          nodeUuid: node.uuid,
          inputs: 0
        }))
      }
      if (node.runtimeContext.outputs !== 1) {
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputs({
          nodeUuid: node.uuid,
          outputs: 1
        }))
      }
    } else if (node.parameters?.type == "view-output") {
      if (node.runtimeContext.inputs !== 1) {
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputs({
          nodeUuid: node.uuid,
          inputs: 1
        }))
      }
      if (node.runtimeContext.outputs !== 0) {
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputs({
          nodeUuid: node.uuid,
          outputs: 0
        }))
      }
    }
  }, initializeServer(nodes, globals) {
    for (const node of nodes) {
      if (node.parameters?.type == "view-input" && node.view) {
        inputMap[node.view] ??= []
        inputMap[node.view].push(node)
      }
    }
  },
})


