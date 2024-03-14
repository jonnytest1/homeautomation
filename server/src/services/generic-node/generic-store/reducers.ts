import { backendToFrontendStoreActions, initializeStore } from './actions'
import { genericNodeDataStore, type DataState } from './reference'
import type { Connection, ElementNode, PreparedNodeData } from '../typing/generic-node-type'
import { jsonClone } from '../../../util/json-clone'



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

genericNodeDataStore.addReducer(backendToFrontendStoreActions.updateNode, (st, a) => {
  return patchNode(st, a.newNode.uuid, n => {
    return a.newNode
  })
})
genericNodeDataStore.addReducer(initializeStore, (st, a) => {
  const connectorMap: PreparedNodeData["connectorMap"] = {}
  const targetConnectorMap: PreparedNodeData["targetConnectorMap"] = {}
  for (const connector of a.data.connections) {
    if (connector.target) {
      connectorMap[connector.source.uuid] ??= []
      connectorMap[connector.source.uuid][connector.source.index] ??= []
      connectorMap[connector.source.uuid][connector.source.index].push(connector.target)

      targetConnectorMap[connector.target?.uuid] ??= []
      targetConnectorMap[connector.target.uuid][connector.target.index] ??= []
      targetConnectorMap[connector.target.uuid][connector.target.index]?.push(connector.source)
    }

  }
  return {
    ...st,
    nodeData: {
      connections: a.data.connections,
      globals: a.data.globals,
      nodes: Object.fromEntries(a.data.nodes.map(n => [n.uuid, n]))
    },
    connectorMap,
    targetConnectorMap
  }
})

genericNodeDataStore.addReducer(backendToFrontendStoreActions.addConnnection, (st, a) => {
  const newConnectorMap: PreparedNodeData["connectorMap"] = {
    ...st.connectorMap,
    [a.connection.source.uuid]: {
      ...st.connectorMap?.[a.connection.source.uuid] ?? {},
      [a.connection.source.index]: [
        ...st.connectorMap?.[a.connection.source.uuid]?.[a.connection.source.index] ?? [],
        a.connection.target
      ]
    }
  }
  const newTargetConnectorMap: PreparedNodeData["targetConnectorMap"] = {
    ...st.targetConnectorMap,
    [a.connection.target.uuid]: {
      ...st.targetConnectorMap?.[a.connection.target.uuid] ?? {},
      [a.connection.target.index]: [
        ...st.connectorMap?.[a.connection.target.uuid]?.[a.connection.target.index] ?? [],
        a.connection.source
      ]
    }
  }
  return {
    ...st,
    nodeData: {
      ...st.nodeData,
      connections: [...st.nodeData.connections, a.connection]
    },
    connectorMap: newConnectorMap,
    targetConnectorMap: newTargetConnectorMap
  }
})

function isSameConnection(conA: Connection, conB: Connection) {
  if (conA.source.uuid !== conB.source.uuid) {
    return false
  }
  if (conA.target!.uuid !== conB.target!.uuid) {
    return false
  }
  if (conA.source.index !== conB.source.index) {
    return false
  }
  if (conA.target!.index !== conB.target!.index) {
    return false
  }
  return true
}
genericNodeDataStore.addReducer(backendToFrontendStoreActions.removeConnnection, (st, a) => {
  const newState: DataState = {
    ...st,
    nodeData: {
      ...st.nodeData,
      connections: st.nodeData.connections.filter(con => !isSameConnection(con, a.connection))
    },
  }

  const connectorAr = st.connectorMap[a.connection.source.uuid]?.[a.connection.source.index]
  if (connectorAr) {
    const newArray = connectorAr.filter(targetCon =>
      (targetCon.uuid != a.connection.target.uuid || targetCon.index !== a.connection.target.index))
    newState.connectorMap = {
      ...st.connectorMap,
      [a.connection.source.uuid]: {
        ...st.connectorMap?.[a.connection.source.uuid] ?? {},
        [a.connection.source.index]: newArray
      }
    }
  }
  const targetConAr = st.targetConnectorMap[a.connection.target.uuid]?.[a.connection.target?.index]
  if (targetConAr) {
    const newTargetCons = targetConAr
      .filter(sourceCon => sourceCon.uuid !== a.connection.source.uuid || sourceCon.index !== a.connection.source.index)

    newState.targetConnectorMap = {
      ...st.targetConnectorMap,
      [a.connection.target.uuid]: {
        ...st.targetConnectorMap?.[a.connection.target.uuid] ?? {},
        [a.connection.target.index]: newTargetCons
      }
    }
  }
  return newState
})

genericNodeDataStore.addReducer(backendToFrontendStoreActions.updateGlobals, (st, a) => {
  return {
    ...st,
    nodeData: {
      ...st.nodeData,
      globals: {
        ...st.nodeData.globals,
        ...a.globals
      },

    }
  }
})


genericNodeDataStore.addReducer(backendToFrontendStoreActions.removeNode, (st, a) => {
  const nodes = { ...st.nodeData.nodes }
  delete nodes[a.node]

  const newConnectorMap = jsonClone(st.connectorMap)
  delete newConnectorMap[a.node]

  for (const nodeUuid in newConnectorMap) {
    for (const index in newConnectorMap[nodeUuid]) {
      newConnectorMap[nodeUuid][index] = newConnectorMap[nodeUuid][index]
        .filter(con => con.uuid !== a.node)
    }
  }

  const newTargetConnectorMap = jsonClone(st.targetConnectorMap)
  delete newTargetConnectorMap[a.node]

  for (const nodeUuid in newTargetConnectorMap) {
    for (const index in newTargetConnectorMap[nodeUuid]) {
      newTargetConnectorMap[nodeUuid][index] = newTargetConnectorMap[nodeUuid][index]
        .filter(con => con.uuid !== a.node)
    }
  }

  const newLastEventTimes = {
    ...st.lastEventTimes
  }
  delete newLastEventTimes[a.node]


  return {
    ...st,
    nodeData: {
      ...st.nodeData,
      nodes: nodes,
      connections: st.nodeData.connections.filter(con => con.source.uuid !== a.node && con.target?.uuid !== a.node)
    },
    connectorMap: newConnectorMap,
    targetConnectorMap: newTargetConnectorMap,
    lastEventTimes: newLastEventTimes
  }
})