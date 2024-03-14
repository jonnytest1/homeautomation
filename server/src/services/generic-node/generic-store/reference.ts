import { DataStore } from '../../../util/data-store/data-store';
import type { Connection, ElementNode, NodeEventTimes, PreparedNodeData } from '../typing/generic-node-type';
import type { NodeDefOptinos, NodeDefToType } from '../typing/node-options';

export interface DataState {
  lastEventTimes: NodeEventTimes


  nodeData: {

    nodes: Record<string, ElementNode>

    connections: Array<Connection>
    globals: NodeDefToType<NodeDefOptinos>
  },
  connectorMap: PreparedNodeData["connectorMap"]
  targetConnectorMap: PreparedNodeData["targetConnectorMap"]
}

export const genericNodeDataStore = new DataStore<DataState>({
  lastEventTimes: {},
  nodeData: {
    connections: [],
    nodes: {},
    globals: {},
  },
  connectorMap: {},
  targetConnectorMap: {}
})


require("./reducers")