import { genericNodeDataStore } from './reference';
import { selectGlobals } from './selectors';
import { NodeEvent } from '../node-event';
import type { NodeEventData } from '../typing/node-event-data';

export function createNodeEvent<C extends object = object>(data: NodeEventData<C>) {


  const globals = genericNodeDataStore.getOnce(selectGlobals)

  return new NodeEvent<C>(data, globals)
}