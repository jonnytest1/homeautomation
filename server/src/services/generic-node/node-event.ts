import type { NodeDefOptinos, NodeDefToType, NodeEventData } from './generic-node-type';

export class NodeEvent<C = unknown, P = unknown, G extends NodeDefOptinos = NodeDefOptinos> {

  declare payload: P
  declare context: C

  declare globalConfig: NodeDefToType<NodeDefOptinos>

  constructor(data: NodeEventData, globals: NodeDefToType<NodeDefOptinos>) {
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