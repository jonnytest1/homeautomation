

export type ContextObject<T> = T & {
  eventCount?: number,
  uuid?: string
  reference?: Partial<T>
  [key: string]: unknown,
}


export type NodeEventData<C = object, T = unknown> = {
  payload: T
  context: ContextObject<C>,
  event_index?: number

}