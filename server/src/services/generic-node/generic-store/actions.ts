import { genericNodeDataStore, type DataState } from './reference'
import { createAction, props, type ActionCreator } from '../../../util/data-store/action'
import type { AddConnection, DeleteConnection, DeleteNOdeEvet, SetConnectionError, StoreEvents, UpdateEditorSchema, UpdateGlobals, UpdateOutputSchema, UpdateParam, UpdatepositionEvent } from '../typing/frontend-events'
import type { ElementNode, NodeData } from '../typing/generic-node-type'

function createReducerAction<T extends (StoreEvents["type"] & string)>(type: T, props: () => Omit<(StoreEvents & { type: T }), "type">) {
  return createAction(type, props)
}

function patchNode(st: DataState, nodeUuid: string, mapper: (node: ElementNode) => ElementNode): DataState {
  return {
    ...st,
    nodeData: {
      ...st.nodeData,
      nodes: {
        ...st.nodeData.nodes,
        [nodeUuid]: mapper(st.nodeData.nodes[nodeUuid])
      }
    }
  }
}
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
  // createReducerAction("update output schema", props<UpdateOutputSchema>()),
  updateGlobals: createReducerAction("update globals", props<UpdateGlobals>()),
  updateParam: createReducerAction("update param", props<UpdateParam>()),
  updatePosition: createReducerAction("update position", props<UpdatepositionEvent>()),

  addConnnection: createReducerAction("add connection", props<AddConnection>()),
  removeConnnection: createReducerAction("delete connection", props<DeleteConnection>()),
  setConnectionError: createReducerAction("set con error", props<SetConnectionError>()),

  removeNode: createReducerAction("delete node", props<DeleteNOdeEvet>())

} satisfies Record<string, ActionCreator<StoreEvents["type"], any>>

export const initializeStore = createAction("initialize node store", props<{
  data: NodeData
}>())


