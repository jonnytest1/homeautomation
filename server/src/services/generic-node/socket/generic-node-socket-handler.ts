import { genericNodeEvents } from './generic-node-socket'
import { registerSocketEvents } from './socket-events'
import { addNode } from '../impl/add-node'
import { getNodeDefintions } from '../type-implementations'
import { typeImplementations } from '../type-implementations'
import { genericNodeDataStore } from '../generic-store/reference'
import { nodeDataWithNodesArray, selectNodesOfType } from '../generic-store/selectors'
import { dispatchAction } from '../generic-store/socket-action-dispatcher'
import { lastEventTimes, lastEventTimesForNodes } from '../last-event-service'
import { jsonEqual } from '../../../util/json-clone'
import { distinctUntilChanged, switchMap, takeWhile } from 'rxjs'

export function registerGenericSocketHandler() {


  registerSocketEvents()

  genericNodeEvents.subscribe(async evt => {
    const genEvt = evt.evt

    console.log("socket event:", genEvt.type)
    genEvt.fromFrontendSocket = true
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
      evt.socketInstanceProperties.receiveChanges = genEvt.forType ?? true

      if (typeof genEvt.forType == "string") {

        genericNodeDataStore.select(selectNodesOfType(genEvt.forType))
          .pipe(
            takeWhile(() => evt.socket.readyState === evt.socket.OPEN),
            switchMap(nodes => {
              return genericNodeDataStore.select(lastEventTimesForNodes(new Set(nodes.map(n => n.uuid))))
            }),
            distinctUntilChanged(jsonEqual)
          ).subscribe(times => {

            evt.reply({
              type: "lastEventTimes",
              data: times
            })
          })
      } else {
        genericNodeDataStore.select(lastEventTimes)
          .pipe(
            takeWhile(() => evt.socket.readyState === evt.socket.OPEN)
          )
          .subscribe(times => {
            evt.reply({
              type: "lastEventTimes",
              data: times
            })
          })
      }
    } else if (genEvt.type == "update position") {
      dispatchAction(genEvt)
      evt.pass(genEvt)
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
      dispatchAction(genEvt)
      evt.pass(genEvt)
    } else if (genEvt.type == "delete connection") {

      dispatchAction(genEvt)
      evt.pass(genEvt)

    } else if (genEvt.type == "update param") {
      dispatchAction(genEvt)
      evt.pass(genEvt)
    } else if (genEvt.type == "page event") {
      const nodeDef = typeImplementations.value?.[genEvt.data?.nodeType]
      if (nodeDef?._socket) {
        nodeDef?._socket.next({
          ...genEvt.data.data,
          ___reply(responseEvt) {
            evt.reply({
              type: "reply",
              messageId: genEvt.data.messageId,
              reply: responseEvt
            })
          },
        })
      }
    } else {
      evt.pass(genEvt)
      debugger
    }
  })
}