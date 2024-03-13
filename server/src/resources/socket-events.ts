import type { FrontendToBackendGenericNodeEvent } from '../services/generic-node/typing/frontend-events'


export type Ping = {
  type: "ping"
}

export type GenericNodeEvent = {
  type: "generic-node-event",
  data: FrontendToBackendGenericNodeEvent
}




export type FrontendToBackendEvents = GenericNodeEvent | Ping