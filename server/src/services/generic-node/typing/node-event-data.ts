

export type ContextObject<T> = T & { eventCount?: number, [key: string]: unknown }


export type NodeEventData<C = unknown, T = unknown> = {
  payload: T
  context: ContextObject<C>,
  event_index?: number
}