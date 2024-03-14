import { addNode, getNodeDefintions, skipEmit, typeImplementations, writeNodes } from './generic-node-service'

import type { NodeData } from './typing/generic-node-type'
import type { FrontendToBackendGenericNodeEvent, StoreEvents } from './typing/frontend-events'
import { lastEventTimes } from './last-event-service'
import { genericNodeDataStore } from './generic-store/reference'
import { backendToFrontendStoreActions } from './generic-store/actions'
import { nodeDataWithNodesArray, selectNodesOfType, selectNodeByUuid } from './generic-store/selectors'
import { dispatchAction } from './generic-store/socket-action-dispatcher'
import { FrontendWebsocket } from '../../resources/frontend-update'
import type { GenericNodeEvents } from '../../resources/websocket-response'
import type { ActionCreator } from '../../util/data-store/action'
import type { Websocket } from 'express-hibernate-wrapper'
import { Subject } from 'rxjs'

genericNodeDataStore.select(lastEventTimes).subscribe(times => {
  if (!FrontendWebsocket?.websockets) {
    return
  }
  FrontendWebsocket.forSockets(async (socket: Websocket, props: ExtendedSocket) => {
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

Object.values(backendToFrontendStoreActions).forEach((actionCreator: ActionCreator<StoreEvents["type"], any>) => {
  genericNodeDataStore.addEffect(actionCreator, (st, a) => {
    if (skipEmit) {
      return
    }
    FrontendWebsocket.forSockets((so, prop: ExtendedSocket) => {
      FrontendWebsocket.sendToWebsocket(so, {
        type: "genericNode",
        data: {
          type: "store-reducer",
          data: a as StoreEvents
        }
      })
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


    const nodeData = genericNodeDataStore.getOnce(nodeDataWithNodesArray)
    evt.reply({
      type: "nodeData",
      data: {
        ...nodeData,
        nodes: nodeData.nodes.map(n => ({
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
  } else if (genEvt.type == "load-action-triggers") {

    const actionNodes = genericNodeDataStore.getOnce(selectNodesOfType("action-trigger"))
    evt.reply({
      type: "action-triggers",
      data: {
        name: "generic-node",
        deviceKey: "generic-node",
        actions: actionNodes.map(node => ({
          name: node.uuid,
          displayText: node.parameters?.name
        }))
      }
    })
  } else if (genEvt.type == "subscribe generic node") {
    evt.socketInstanceProperties.receiveChanges = true
  } else if (genEvt.type == "update position") {
    //TODO: use reducer
    const node = genericNodeDataStore.getOnce(selectNodeByUuid(genEvt.node))
    if (node) {
      node.position = genEvt.position
      evt.pass(genEvt)
      writeNodes()
      // updateNode(genEvt.node)
    }
  } else if (genEvt.type == "delete node") {
    dispatchAction(genEvt)
    evt.pass(genEvt)
  } else if (genEvt.type == "add node") {
    await addNode(genEvt.node)
    evt.pass(genEvt)
  } else if (genEvt.type == "update globals") {

    dispatchAction(genEvt)
    evt.pass(genEvt)
  } else if (genEvt.type == "add connection") {
    evt.pass(genEvt)
    dispatchAction(genEvt)
  } else if (genEvt.type == "delete connection") {

    dispatchAction(genEvt)
    evt.pass(genEvt)

  } else if (genEvt.type == "update param") {
    dispatchAction(genEvt)
    evt.pass(genEvt)
  } else {
    evt.pass(genEvt)
    debugger
  }
})