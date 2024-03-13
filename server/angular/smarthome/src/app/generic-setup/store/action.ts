import { ActionCreator, createAction, props } from '@ngrx/store';
import { Connection, ElementNode, NodeData, type NodeDefintion } from '../../settings/interfaces';

export const setNodeData = createAction("setnodes", props<{ data: NodeData }>())
export const updateNode = createAction("update node", props<{ data: ElementNode }>())
export const updateNodeDef = createAction("update node definitions", props<{ data: Record<string, NodeDefintion> }>())

export type BackendActionType = { backendAction?: true, dispatched?: true }
function backendAction<T extends Record<string, ActionCreator>>(actions: T) {
  for (const key in actions) {
    const creator = actions[key]
    const creatorFunction: any = function create(props) {
      const obj = creator(props) as BackendActionType;
      obj.backendAction = true;
      return obj;
    };
    creatorFunction.type = creator.type
    Object.defineProperty(actions, key, {
      value: creatorFunction
    })
  }

  return actions
}


export const backendActions = backendAction({
  updatePosition: createAction("update position", props<{ node: string, position: NodeData["nodes"][number]["position"] }>()),
  deleteNode: createAction("delete node", props<{ node: string }>()),
  addNode: createAction("add node", props<{ node: ElementNode }>()),
  deleteConnection: createAction("delete connection", props<{ connection: Connection }>()),
  addConnection: createAction("add connection", props<{ connection: Connection }>()),
  updateGlobals: createAction("update globals", props<{ globals: Partial<NodeData["globals"]> }>()),
  updateParameters: createAction("update params", props<{
    node: string
    params: Partial<NodeData["nodes"][number]["parameters"]>
  }>()),
})


export type BackendActionsMap = typeof backendActions


export type BackendActions = ReturnType<BackendActionsMap[keyof BackendActionsMap]>