import { genericNodeDataStore } from './reference';
import { selectGlobals } from './selectors';
import { NodeEvent } from '../node-event';
import type { ContextObject, NodeEventData } from '../typing/node-event-data';
import { v4 } from "uuid"
export function createNodeEvent<C extends object = object>(data: NodeEventData<C>) {


  const globals = genericNodeDataStore.getOnce(selectGlobals)
  data.context ??= {} as ContextObject<C>
  data.context.uuid ??= v4()
  return new NodeEvent<C>(data, globals)
}