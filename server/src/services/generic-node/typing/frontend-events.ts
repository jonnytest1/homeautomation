import type { Connection, NodeData } from './generic-node-type'

export type StoreNodes = {
  type: "store-nodes",
  data: NodeData
  changedUuid?: string
}

export type Load = {
  type: "load-node-data"
}
export type LoadActionTriggers = {
  type: "load-action-triggers"
}


export type UpdatepositionEvent = {
  type: "update position",
  node: string,
  position: NodeData["nodes"][number]["position"]
}
export type DeleteNOdeEvet = {
  type: "delete node",
  node: string
}
export type AddNOdeEvet = {
  type: "add node",
  node: NodeData["nodes"][number]
}

export type AddConnection = {
  type: "add connection",
  connection: Connection
}
export type DeleteConnection = {
  type: "delete connection",
  connection: Connection
}
export type UpdateGlobals = {
  type: "update globals",
  globals: Partial<NodeData["globals"]>
}
export type SubscribeGenericNode = {
  type: "subscribe generic node"
}
export type Updateparams = {
  type: "update params",
  node: string
  params: Partial<NodeData["nodes"][number]["parameters"]>
}
export type StoreEvents = UpdatepositionEvent | DeleteNOdeEvet | AddNOdeEvet | AddConnection | DeleteConnection | Updateparams | UpdateGlobals


export type FrontendToBackendGenericNodeEvent = StoreNodes | Load | UpdatepositionEvent | StoreEvents | LoadActionTriggers | SubscribeGenericNode