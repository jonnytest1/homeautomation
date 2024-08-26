import type { DataState } from './state';
import { DataStore } from '../../../util/data-store/data-store';


export const genericNodeDataStore = new DataStore<DataState>({
  lastEventTimes: {},
  nodeData: {
    connections: {},
    nodes: {},
    globals: {},
  },
  connectorMap: {},
  targetConnectorMap: {}
})


require("./reducers")