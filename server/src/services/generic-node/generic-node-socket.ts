import { addConnection, addNode, deleteNode, getNodeDefintions, nodes, removeConnection, setNodes, skipEmit, typeImplementations, updateNode, writeNodes } from './generic-node-service'

import type { NodeData } from './typing/generic-node-type'
import type { FrontendToBackendGenericNodeEvent, StoreEvents } from './typing/frontend-events'
import { genericNodeDataStore } from './generic-node-data-store'
import { lastEventTimes } from './last-event-service'
import { FrontendWebsocket } from '../../resources/frontend-update'
import type { GenericNodeEvents } from '../../resources/websocket-response'
import type { Websocket } from 'express-hibernate-wrapper'
import { Subject } from 'rxjs'

nodes.subscribe(nodeUpdates => {
  if (skipEmit) {
    return
  }
  FrontendWebsocket?.forSockets(async (socket: Websocket, props: ExtendedSocket) => {
    if (props.isUpdatingNodes) {
      return
    }
    if (!props.receiveChanges) {
      return
    }

    const cacheData = props.nodeCache

    if (cacheData && JSON.stringify({
      c: cacheData.connections,
      g: cacheData.globals
    }) == JSON.stringify({
      c: nodeUpdates.connections,
      g: nodeUpdates.globals
    })) {
      if (nodeUpdates.nodes.length < cacheData.nodes.length) {
        FrontendWebsocket.sendToWebsocket(socket, {
          type: "genericNode",
          data: {
            type: "nodeData",
            data: {
              ...nodeUpdates,
              nodes: nodeUpdates.nodes.map(n => ({
                ...n,
                serverContext: undefined
              }))
            }
          }
        })
        props.nodeCache = JSON.parse(JSON.stringify(nodeUpdates))
        return
      }
      for (const node of nodeUpdates.nodes) {
        if (JSON.stringify(node) != JSON.stringify(cacheData.nodes.find(n => n.uuid === node.uuid))) {
          FrontendWebsocket.sendToWebsocket(socket, {
            type: "genericNode",
            data: {
              type: "nodeUpdate",
              data: {
                ...node,
                serverContext: undefined
              }
            }
          })
        }
      }
    } else {
      FrontendWebsocket.sendToWebsocket(socket, {
        type: "genericNode",
        data: {
          type: "nodeData",
          data: {
            ...nodeUpdates,
            nodes: nodeUpdates.nodes.map(n => ({
              ...n,
              serverContext: undefined
            }))
          }
        }
      })
    }


    props.nodeCache = JSON.parse(JSON.stringify(nodeUpdates))
  })
})


genericNodeDataStore.select(lastEventTimes).subscribe(times => {
  if (!FrontendWebsocket?.websockets) {
    return
  }
  FrontendWebsocket.forSockets(async (socket: Websocket, props: ExtendedSocket) => {
    if (props.isUpdatingNodes) {
      return
    }
    if (!props.receiveChanges) {
      return
    }
    FrontendWebsocket.sendToWebsocket(socket, {
      type: "genericNode",
      data: {
        type: "lastEventTimes",
        data: times
      }
    })
  })
})


typeImplementations.subscribe(async typeImpl => {
  if (!FrontendWebsocket?.websockets) {
    return
  }
  FrontendWebsocket.forSockets(async (socket: Websocket, props: ExtendedSocket) => {
    if (props.receiveChanges) {
      FrontendWebsocket.sendToWebsocket(socket, {
        type: "genericNode",
        data: {
          type: "nodeDefinitions",
          data: getNodeDefintions()
        }
      })
    }
  })
})
export type ExtendedSocket = {
  isUpdatingNodes?: boolean,
  nodeCache?: NodeData
  receiveChanges?: boolean
}

interface GenericNodeEvent<T = object> {
  evt: FrontendToBackendGenericNodeEvent
  socket: Websocket
  reply: (resp: GenericNodeEvents) => void
  pass: (resp: StoreEvents) => void
  socketInstanceProperties: T
}

export const genericNodeEvents = new Subject<GenericNodeEvent<ExtendedSocket>>()


genericNodeEvents.subscribe(async evt => {
  const genEvt = evt.evt

  console.log("socket event:", genEvt.type)
  if (genEvt.type === "load-node-data") {
    evt.reply({
      type: "nodeDefinitions",
      data: getNodeDefintions()
    })
    evt.reply({
      type: "nodeData",
      data: {
        ...nodes.value,
        nodes: nodes.value.nodes.map(n => ({
          ...n,
          serverContext: undefined
        }))
      }
    })
    evt.reply({
      type: "lastEventTimes",
      data: genericNodeDataStore.getOnce(lastEventTimes)
    })
    evt.socketInstanceProperties.receiveChanges = true
    evt.socketInstanceProperties.nodeCache = JSON.parse(JSON.stringify(nodes.value))
  } else if (genEvt.type == "load-action-triggers") {
    evt.reply({
      type: "action-triggers",
      data: {
        name: "generic-node",
        deviceKey: "generic-node",
        actions: nodes.value.nodes
          ?.filter(node => node.type === "action-trigger")
          ?.map(node => ({
            name: node.uuid,
            displayText: node.parameters?.name
          }))
      }
    })
  } else if (genEvt.type == "store-nodes") {
    //evt.socket.isUpdatingNodes = true
    await setNodes(genEvt.data, genEvt.changedUuid)
    evt.socketInstanceProperties.isUpdatingNodes = false
  } else if (genEvt.type == "subscribe generic node") {
    evt.socketInstanceProperties.receiveChanges = true
  } else if (genEvt.type == "update position") {
    evt.socketInstanceProperties.isUpdatingNodes = true
    const node = nodes.value?.nodes?.find(n => n.uuid === genEvt.node);
    if (node) {
      node.position = genEvt.position
      evt.pass(genEvt)
      writeNodes()
      // updateNode(genEvt.node)
    }
    evt.socketInstanceProperties.isUpdatingNodes = false
  } else if (genEvt.type == "delete node") {
    evt.socketInstanceProperties.isUpdatingNodes = true
    const nodeData = nodes.value
    if (nodeData) {
      await deleteNode(genEvt.node)
      evt.pass(genEvt)
    }
    evt.socketInstanceProperties.isUpdatingNodes = false
  } else if (genEvt.type == "add node") {
    evt.socketInstanceProperties.isUpdatingNodes = true
    const nodeData = nodes.value
    if (nodeData) {
      await addNode(genEvt.node)
      evt.pass(genEvt)
    }
    evt.socketInstanceProperties.isUpdatingNodes = false
  } else if (genEvt.type == "update params") {
    evt.socketInstanceProperties.isUpdatingNodes = true
    const node = nodes.value?.nodes?.find(n => n.uuid === genEvt.node);
    if (node) {

      evt.pass(genEvt)
      await updateNode(genEvt.node, () => {
        node.parameters = {
          ...node.parameters,
          ...genEvt.params
        }
      })
      writeNodes()
    }
    evt.socketInstanceProperties.isUpdatingNodes = false
  } else if (genEvt.type == "update globals") {
    nodes.value.globals = {
      ...nodes.value?.globals ?? {},
      ...genEvt.globals
    }
    evt.pass(genEvt)
    writeNodes()
  } else if (genEvt.type == "add connection") {

    evt.pass(genEvt)
    addConnection(genEvt.connection)
  } else if (genEvt.type == "delete connection") {
    removeConnection(genEvt.connection)
    evt.pass(genEvt)

  } else {
    evt.pass(genEvt)
    debugger
  }
})