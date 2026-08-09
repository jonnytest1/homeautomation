

export type ContextObject<T> = T & { eventCount?: number, [key: string]: unknown, reference?: Partial<T> }


export type NodeEventData<C = object, T = unknown> = {
  payload: T
  context: ContextObject<C>,
  event_index?: number

}