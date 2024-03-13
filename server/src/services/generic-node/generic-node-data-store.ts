import type { NodeData, NodeEventTimes } from './typing/generic-node-type';
import { DataStore } from '../../util/data-store/data-store';

export interface DataState extends NodeData {
  lastEventTimes: NodeEventTimes
}


export const genericNodeDataStore = new DataStore<DataState>({
  connections: [],
  nodes: [],
  globals: {},
  lastEventTimes: {}
})