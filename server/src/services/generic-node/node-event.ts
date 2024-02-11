
import type { NodeEventData } from './typing/node-event-data';
import type { NodeDefOptinos, NodeDefToType } from './typing/node-options';

export class NodeEvent<C = unknown, P = unknown, G extends NodeDefOptinos = NodeDefOptinos> {

  declare payload: P
  declare context: C

  declare globalConfig: NodeDefToType<G>

  constructor(data: NodeEventData, globals: NodeDefToType<G>) {
    Object.defineProperty(this, 'payload', {
      enumerable: true,
      configurable: true,
      get: () => data.payload
    });
    Object.defineProperty(this, 'context', {
      enumerable: true,
      get: () => data.context
    });



    Object.defineProperty(this, "globalConfig", {
      enumerable: false,
      get: () => globals
    })


  }

  updatePayload(newPayload: unknown) {
    Object.defineProperty(this, 'payload', {
      enumerable: true,
      get: () => newPayload
    });
  }


  copy(): unknown {
    return JSON.parse(JSON.stringify(this))
  }


}