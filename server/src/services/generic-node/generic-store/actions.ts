import { genericNodeDataStore } from './reference'
import type { DataState } from './state'
import { createAction, props, type ActionCreator } from '../../../util/data-store/action'
import type { AddConnection, DeleteConnection, DeleteNOdeEvet, SetConnectionError, StoreEvents, UpdateEditorSchema, UpdateGlobals, UpdateInputSchema, UpdateOutputSchema, UpdateParam, UpdateParamDefinition, UpdatepositionEvent, UpdateRuntimeInfo } from '../typing/frontend-events'
import type { NodeData } from '../typing/generic-node-type'
import type { ElementNode } from '../typing/element-node'

function createReducerAction<T extends (StoreEvents["type"] & string)>(type: T, props: () => Omit<(StoreEvents & { type: T }), "type">) {
  return createAction(type, props)
}
export function patchNode(st: DataState, nodeUuid: string, mapper: (node: ElementNode) => ElementNode): DataState {
  const previousnodeStr = JSON.stringify(st.nodeData.nodes[nodeUuid])
  const newNode = mapper(st.nodeData.nodes[nodeUuid])
  if (JSON.stringify(newNode) === previousnodeStr) {
    return st
  }
  return {
    ...st,
    nodeData: {
      ...st.nodeData,
      nodes: {
        ...st.nodeData.nodes,
        [nodeUuid]: newNode
      }
    }
  }
}

/**
 * @file file://./../../../../angular/smarthome/src/app/generic-setup/store/reducers.ts
 */


export const backendToFrontendStoreActions = {
  /**
   * @deprecated should be made more specific (except for add)
   */
  updateNode: createReducerAction("update node", props<{
    newNode: ElementNode
  }>()),

  updateEditorSchema: createReducerAction("update editor schema", props<UpdateEditorSchema>()),
  updateOutputSchema: genericNodeDataStore.createReducerAction("update output schema", (st, a) => {
    return patchNode(st, a.nodeUuid, n => ({
      ...n,
      runtimeContext: {
        ...n.runtimeContext,
        outputSchema: a.schema
      }
    }))
  }, props<UpdateOutputSchema>()),

  updateInputSchema: genericNodeDataStore.createReducerAction("update input schema", (st, a) => {
    return patchNode(st, a.nodeUuid, n => ({
      ...n,
      runtimeContext: {
        ...n.runtimeContext,
        inputSchema: a.schema
      }
    }))
  }, props<UpdateInputSchema>()),
  // createReducerAction("update output schema", props<UpdateOutputSchema>()),
  updateGlobals: createReducerAction("update globals", props<UpdateGlobals>()),
  updateParam: createReducerAction("update param", props<UpdateParam>()),
  updateParamDefinition: genericNodeDataStore.createReducerAction("update param definition", (st, a) => {
    return patchNode(st, a.nodeUuid, n => {
      return {
        ...n,
        runtimeContext: {
          ...n.runtimeContext,
          parameters: {
            ...n.runtimeContext.parameters,
            [a.param]: a.value
          }
        }
      }
    })
  }, props<UpdateParamDefinition>()),
  updateRuntimeInfo: genericNodeDataStore.createReducerAction("update runtime info", (st, a) => {
    return patchNode(st, a.nodeUuid, n => {
      return {
        ...n,
        runtimeContext: {
          ...n.runtimeContext,
          info: a.info
        }
      }
    })
  }, props<UpdateRuntimeInfo>()),
  updatePosition: createReducerAction("update position", props<UpdatepositionEvent>()),

  addConnnection: createReducerAction("add connection", props<AddConnection>()),
  removeConnnection: createReducerAction("delete connection", props<DeleteConnection>()),
  setConnectionError: createReducerAction("set con error", props<SetConnectionError>()),

  removeNode: createReducerAction("delete node", props<DeleteNOdeEvet>())

} satisfies Record<string, ActionCreator<StoreEvents["type"], any>>

export const initializeStore = createAction("initialize node store", props<{
  data: NodeData
}>())


export const setServerContext = createAction("update server context", props<{
  nodeUuid: string,
  key: string
  value: unknown
}>())

