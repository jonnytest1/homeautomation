import type { Connection, ConnectorDefintion, NodeEventTimes } from '../typing/generic-node-type'
import type { ElementNode } from '../typing/element-node'
import type { NodeDefOptinos, NodeDefToType } from '../typing/node-options'

export interface DataState {
  lastEventTimes: NodeEventTimes
  initialized: boolean

  nodeData: {

    nodes: Record<string, ElementNode>

    connections: Record<string, Connection>
    globals: NodeDefToType<NodeDefOptinos>
  },
  connectorMap: Record<string, { [outputindex: number]: Array<ConnectorDefintion> }>
  targetConnectorMap: Record<string, {
    [inputindex: number]: (Omit<Connection, "target"> & { target: undefined })[];
  }>
}