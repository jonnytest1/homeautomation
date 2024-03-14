import { genericNodeDataStore } from './reference';
import type { NodeData } from '../typing/generic-node-type';

export const nodeDataSelector = genericNodeDataStore.createSelector(s => s.nodeData)

export const selectConnectorMap = genericNodeDataStore.createSelector(nodeData => {
  return nodeData.connectorMap
})
export const selectConnectorForNodeUuid = (uuid: string) => selectConnectorMap.chain(conMap => {
  return conMap[uuid]
})


export const selectTargetConnectorMap = genericNodeDataStore.createSelector(nodeData => {
  return nodeData.targetConnectorMap
})
export const nodeDataWithNodesArray = nodeDataSelector.chain(nodeData => {
  const data: NodeData = {
    connections: nodeData.connections,
    globals: nodeData.globals,
    nodes: Object.values(nodeData.nodes)
  }
  return data
})


export const selectNodeMap = nodeDataSelector.chain(nodeData => {
  return nodeData.nodes
})



export const selectNodeByUuid = (uuid: string) => selectNodeMap.chain(nodeData => {
  return nodeData[uuid]
})

export const selectNodesOfType = (type: string) => selectNodeMap.chain(nodeData => {
  return Object.values(nodeData).filter(n => n.type === type);
})


export const selectGlobals = nodeDataSelector.chain(nodeData => {
  return nodeData.globals
})
