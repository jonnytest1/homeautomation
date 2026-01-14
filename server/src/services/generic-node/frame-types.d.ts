



export type EventMap = { type: string, param: unknown, response: unknown }

export type SendToNodeImplOptions = {
  multiEmit?: boolean
}

type Subject<T> = {
  subscribe(callback: (param: T) => void)
}



export interface SendToNodeImplFnc<Obj extends EventMap> {
  <T extends Obj["type"]>(evt: (Obj & { type: T })["param"] & { type: T }, opts?: SendToNodeImplOptions & { multiEmit: true }): Subject<(Obj & { type: T })["response"]>
  <T extends Obj["type"]>(evt: (Obj & { type: T })["param"] & { type: T }, opts?: SendToNodeImplOptions): Promise<(Obj & { type: T })["response"]>
}



declare global {
  let sendToNodeImplementation: SendToNodeImplFnc<any>
}
