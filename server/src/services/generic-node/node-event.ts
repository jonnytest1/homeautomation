
import type { ContextObject, NodeEventData } from './typing/node-event-data';
import type { NodeDefOptinos, NodeDefToType } from './typing/node-options';


export type NodeEventJsonData<P = unknown, C = unknown> = {
  payload: P,
  context: ContextObject<C>
}



export class NodeEvent<C = unknown, P = unknown, G extends NodeDefOptinos = NodeDefOptinos> {

  declare payload: P
  declare context: C & { eventCount?: number, [key: string]: unknown }

  declare globalConfig: NodeDefToType<G>

  inputIndex: number

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

    return new NodeEvent<C>(this.copy(), this.globalConfig)
  }

}