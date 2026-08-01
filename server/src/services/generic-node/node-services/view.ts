import { logKibana } from '../../../util/log';
import type { ElementNodeImpl } from '../element-node';
import { updateRuntimeParameter } from '../element-node-fnc';
import { addTypeImpl, emitFromNode } from '../generic-node-service';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { createNodeEvent } from '../generic-store/node-event-factory';
import { genericNodeDataStore } from '../generic-store/reference';
import { selectNodeByUuid, selectNodesOfType, selectViewNodesByView } from '../generic-store/selectors';
import { nestedCallTrace } from '../node-trace';
import type { PlaceHolder, Select } from '../typing/node-options';


const inputMap: Record<string, Array<ElementNodeImpl>> = {}

type ViewTypes = "view-output" | "view-input" | "collection"


addTypeImpl({
  context_type(c: { viewsource: Array<string> }) {
    return c
  },
  nodeDefinition: () => ({
    type: "view",
    inputs: 1,
    outputs: 0,
    options: {
      type: {
        type: "placeholder",
        of: "select",
        invalidates: ["target"]
      } as PlaceHolder<Select<ViewTypes>>,
      target: {
        type: "placeholder",
        of: "select"
      },
    }
  }),
  process(node, data, callbacks) {

    if (node.parameters?.type == "collection") {
      const targetUuid = node.parameters.target ?? node.uuid
      const viewNodes = genericNodeDataStore.getOnce(selectViewNodesByView(targetUuid))
      const inputs = viewNodes.filter(node => node.parameters?.type == "view-input")
      if (!inputs.length) {
        logKibana("WARN", "view called without input nodes");
      }
      for (const input of inputs) {
        const event = createNodeEvent(data).clone()
        event.context.viewsource ??= []
        event.context.viewsource.unshift(node.uuid)
        emitFromNode(input.uuid, event, 0, nestedCallTrace(input, callbacks.trace, "impliedFromViewInput"))
      }



    } else if (node.parameters?.type == "view-output" && node.view) {
      const event = createNodeEvent(data)
      const sourceNode = event.context.viewsource.shift() ?? node.view
      const viewNode = genericNodeDataStore.getOnce(selectNodeByUuid(sourceNode))
      emitFromNode(sourceNode, event, 0, nestedCallTrace(viewNode, callbacks.trace, "impliedForViewOutput"))
    }
  },
  nodeChanged(node, prevNode) {
    node.runtimeContext ??= {}
    if (node.view) {
      updateRuntimeParameter(node, "type", {
        type: "select",
        options: ["collection", "view-input", "view-output"] as Array<ViewTypes>
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

      if (node.parameters.type === "collection") {
        const nodes = (genericNodeDataStore.getOnce(selectNodesOfType("view")) as Array<typeof node>)
          .filter(n =>
            n.parameters.type == "collection"
            && n.parameters.name?.length
            && n.uuid !== node.uuid
            && (genericNodeDataStore.getOnce(selectViewNodesByView(n.uuid)) as Array<typeof node>)
              .find(n2 => n2.parameters?.type == "view-input"))
        updateRuntimeParameter(node, "target", {
          type: "select",
          options: ["", ...nodes.map(n => n.uuid)],
          optionDisplayNames: ["", ...nodes.map(n => n.parameters.name!)]
        })
      }

      if (node.parameters.target
        && node.parameters.target !== prevNode?.parameters?.target
        && !node.parameters.name) {
        const targetNode = genericNodeDataStore.getOnce(selectNodeByUuid(node.parameters.target))



        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateParam({
          node: node.uuid,
          param: "name",
          value: `ref > ${targetNode.parameters?.name}`
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


