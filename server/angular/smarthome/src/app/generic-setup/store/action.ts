import type { Action, ActionCreator, ActionCreatorProps, ActionReducer, NotAllowedCheck } from '@ngrx/store';
import { createAction, props } from '@ngrx/store';
import type { Connection, ElementNode, NodeData, NodeOptionTypes, SetConnectionError, UpdateCombinedSchema, UpdateEditorSchema, UpdateInputSchema, UpdateOutputSchema } from '../../settings/interfaces';
import { type NodeDefintion } from '../../settings/interfaces';
import type { GenericNodeState } from './reducers';
import { patchNode } from './reducer-util';
export const setNodeData = createAction("setnodes", props<{ data: NodeData }>())
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

type Reducer<St, A> = (state: St, action: A) => St
export const reducerMap = new Map<ActionCreator<string, any>, Reducer<GenericNodeState, Action>>();


function createActionReducerFromProps<Props extends { type: string }>(type: Props extends { type: infer T } ? T : never, reducer: Reducer<GenericNodeState, Props>) {
  type Prop = {
    [K in keyof Props]: K extends "type" ? never : Props[K]
  }

  return createActionWithReducer(type, props<any>() as ActionCreatorProps<Prop> & NotAllowedCheck<Prop>, reducer)
}


function createActionWithReducer<T extends string, PropsT extends object>(type: T, config: ActionCreatorProps<PropsT> & NotAllowedCheck<PropsT>,
  reducer: Reducer<GenericNodeState, PropsT & { type: T }>) {
  const actionCreator = createAction(type, config)

  reducerMap.set(actionCreator, reducer);
  return actionCreator;
}



export const backendActions = backendAction({
  updatePosition: createAction("update position", props<{ node: string, position: NodeData["nodes"][number]["position"] }>()),
  deleteNode: createAction("delete node", props<{ node: string }>()),
  addNode: createAction("add node", props<{ node: ElementNode }>()),
  deleteConnection: createAction("delete connection", props<{ connection: Connection }>()),
  addConnection: createAction("add connection", props<{ connection: Connection }>()),
  setConError: createAction("set con error", props<Omit<SetConnectionError, "type">>()),
  updateGlobals: createAction("update globals", props<{ globals: Partial<NodeData["globals"]> }>()),
  updateParameter: createAction("update param", props<{
    node: string
    param: string
    value: string
  }>()),
  updateParameterDefinition: createActionWithReducer("update param definition", props<{
    nodeUuid: string
    param: string
    value: NodeOptionTypes
  }>(), (st, a) => {
    return patchNode(st, a.nodeUuid, node => {
      return {
        ...node,
        runtimeContext: {
          ...node.runtimeContext,
          parameters: {
            ...node.runtimeContext.parameters,
            [a.param]: a.value
          }
        }
      }
    })
  }),
  updateRuntimeInfo: createActionWithReducer("update runtime info", props<{
    nodeUuid: string
    info: string
  }>(), (st, a) => {
    return patchNode(st, a.nodeUuid, node => {
      return {
        ...node,
        runtimeContext: {
          ...node.runtimeContext,
          info: a.info
        }
      }
    })
  }),
  updateNode: createAction("update node", props<{
    nodeUuid: string
    newNode: ElementNode
  }>()),
  updateEditorSchema: createAction("update editor schema", props<Omit<UpdateEditorSchema, "type">>()),

  updateOutputSchema: createActionWithReducer("update output schema", props<Omit<UpdateOutputSchema, "type">>(), (st, a) => {
    return patchNode(st, a.nodeUuid, n => ({
      ...n,
      runtimeContext: {
        ...n.runtimeContext,
        outputSchema: a.schema
      }
    }))
  }),
  updateInputSchema: createActionWithReducer("update input schema", props<Omit<UpdateInputSchema, "type">>(), (st, a) => {
    return patchNode(st, a.nodeUuid, n => ({
      ...n,
      runtimeContext: {
        ...n.runtimeContext,
        inputSchema: a.schema
      }
    }))
  }),
  updateInputs: createActionWithReducer("update inputs", props<{
    nodeUuid: string
    inputs: number
  }>(), (st, a) => {
    return patchNode(st, a.nodeUuid, node => {
      return {
        ...node,
        runtimeContext: {
          ...node.runtimeContext,
          inputs: a.inputs
        }
      }
    })
  }),
  updateOutputs: createActionWithReducer("update outputs", props<{
    nodeUuid: string
    outputs: number
  }>(), (st, a) => {
    return patchNode(st, a.nodeUuid, node => {
      return {
        ...node,
        runtimeContext: {
          ...node.runtimeContext,
          outputs: a.outputs
        }
      }
    })
  }),
})


export const frontendActions = {
  updateTouchMode: createActionWithReducer("update touchmode", props<{ touchmode: boolean }>(), (st, a) => {
    return {
      ...st,
      touchmode: a.touchmode
    }
  })

}


export type BackendActionsMap = typeof backendActions


export type BackendActions = ReturnType<BackendActionsMap[keyof BackendActionsMap]>