import { genericNodeDataStore } from './reference';
import { selectGlobals } from './selectors';
import { NodeEvent } from '../node-event';
import type { ContextObject, NodeEventData } from '../typing/node-event-data';

export function createNodeEvent<C extends object = object>(data: NodeEventData<C>) {


  const globals = genericNodeDataStore.getOnce(selectGlobals)
  data.context ??= {} as ContextObject<C>
  data.context.reference ??= {}
  return new NodeEvent<C>(data, globals)
}