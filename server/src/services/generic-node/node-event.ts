
import type { ContextObject, NodeEventData } from './typing/node-event-data';
import type { NodeDefOptinos, NodeDefToType } from './typing/node-options';


export type NodeEventJsonData<P = unknown, C = unknown> = {
  payload: P,
  context: ContextObject<C>
}



export class NodeEvent<C = object, P = unknown, G extends NodeDefOptinos = NodeDefOptinos> {

  declare payload: P
  declare context: C & ContextObject<C>

  declare globalConfig: NodeDefToType<G>

  declare inputIndex: number

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


  copy(): NodeEventJsonData<unknown, C> {
    return JSON.parse(JSON.stringify(this))
  }

  clone() {
    const refctx = this.context.reference ?? {} as Partial<C>
    const cpy = this.copy();
    cpy.context.reference = refctx
    return new NodeEvent<C>(cpy, this.globalConfig)
  }

}