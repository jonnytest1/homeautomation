export type StoreNodes = {
  type: "store-nodes",
  data: {
    nodes
    connections
  }
  changedUuid?: string
}
export type Ping = {
  type: "ping"
}



export type FrontendToBackendEvents = StoreNodes | Ping