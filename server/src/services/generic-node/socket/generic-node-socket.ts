
import type { FrontendToBackendGenericNodeEvent, StoreEvents } from '../typing/frontend-events'
import type { GenericNodeEvents } from '../../../resources/websocket-response'
import type { Websocket } from 'express-hibernate-wrapper'
import { Subject } from 'rxjs'

export type ExtendedSocket = {
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

