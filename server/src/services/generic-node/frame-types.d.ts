



export type EventMap = { type: string, param: unknown, response: unknown }

export type SendToNodeImplFnc<Obj extends EventMap> = <T extends Obj["type"]>(evt: (Obj & { type: T })["param"] & { type: T }) =>
  Promise<(Obj & { type: T })["response"]>





declare global {
  let sendToNodeImplementation: SendToNodeImplFnc<any>
}
