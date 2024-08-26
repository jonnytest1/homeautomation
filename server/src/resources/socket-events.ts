import type { FrontendToBackendGenericNodeEvent } from '../services/generic-node/typing/frontend-events'


export type Ping = {
  type: "ping"
}

export type GenericNodeEvent = {
  type: "generic-node-event",
  data: FrontendToBackendGenericNodeEvent
}

export type GenericPageEvent = {
  type: "generic-node-page-event",
  data: unknown,
  nodeType: string
}
export type DeviceData = {
  type: "device-data",
  data: unknown,
}



export type FrontendToBackendEvents = GenericNodeEvent | Ping | GenericPageEvent | DeviceData