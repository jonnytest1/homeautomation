import type { ExtendedSocket } from './generic-node-socket'
import { FrontendWebsocket } from '../../../resources/frontend-update'
import { genericNodeDataStore } from '../generic-store/reference'
import { lastEventTimes } from '../last-event-service'
import { backendToFrontendStoreActions } from '../generic-store/actions'
import type { Action, ActionCreator } from '../../../util/data-store/action'
import type { StoreEvents } from '../typing/frontend-events'
import { skipEmit } from '../emit-flag'
import { getNodeDefintions } from '../type-implementations'
import { typeImplementations } from '../type-implementations'
import type { Websocket } from 'express-hibernate-wrapper'


export function registerSocketEvents() {

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
    genericNodeDataStore.addEffect(actionCreator, (st, a: Action<StoreEvents["type"], any> & { fromFrontendSocket?: boolean }) => {
      if (skipEmit) {
        return
      }
      if (a.fromFrontendSocket) {
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

}