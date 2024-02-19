import type { MapTypeToParam, NodeDefOptinos, NodeOptionTypes } from './typing/node-options';
import type { Callbacks, ElementNode as ELN, ExtendedJsonSchema, TypeImplementaiton } from './typing/generic-node-type';
import type { NodeEvent } from './node-event';
export class ElementNodeImpl<T = { [optinoskey: string]: string }, P = Partial<NodeDefOptinos>> implements ELN<T, P>, Callbacks {

  parameters?: Partial<T> | undefined;
  position: { x: number; y: number; };
  type: string;
  uuid: string;
  runtimeContext: {
    inputSchema?: {
      jsonSchema: ExtendedJsonSchema;
      dts: string;
    } | undefined;
    outputSchema?: {
      jsonSChema: ExtendedJsonSchema;
      dts: string;
    } | undefined;

    info?: string | undefined;
    parameters?: Partial<P> | undefined;
  };
  globalContext?: NodeDefOptinos | undefined;



  constructor(node: ELN<T, P>, callbacks: Callbacks) {
    Object.assign(this, node)
    Object.assign(this, callbacks)
  }

  declare continue: (evt: NodeEvent<unknown, unknown, NodeDefOptinos>, index?: number | undefined) => void;
  declare updateNode: () => void;
}


type SetNodeOption<T extends string> = {
  [key in T]: NodeOptionTypes
}
type SetNodeParamVAlue<K extends string, V extends NodeOptionTypes> = {
  [key in K]: MapTypeToParam<V, K>
}


export function checkInvalidations<T, P, K extends (keyof P & keyof T & string), V extends NodeOptionTypes & P[K]>(typeImpl: TypeImplementaiton, node: ELN<T, P>, prev: ELN<T, P> | null) {
  if (prev?.parameters) {
    const def = typeImpl.nodeDefinition()
    for (const key in def.options) {
      const opt = def.options[key]

      if (opt.invalidates) {
        if (prev?.parameters?.[key] && node?.parameters?.[key] && node?.parameters?.[key] !== prev?.parameters?.[key]) {
          for (const invalidator of opt.invalidates) {
            delete node.parameters[invalidator]
            delete node.runtimeContext?.parameters?.[invalidator]
          }
        }
      }
    }
  }

}

export function updateRuntimeParameter<T, P, K extends (keyof P & keyof T & string), V extends NodeOptionTypes & P[K]>(node: ElementNodeImpl<T, P>,
  key: K, param: V, inital: number | string | false = 0): asserts node is ElementNodeImpl<T, P> & {
    parameters: SetNodeParamVAlue<K, V>,
    runtimeContext: {
      parameters: SetNodeOption<K>
    }
  } {

  node.runtimeContext.parameters ??= {}
  node.parameters ??= {}
  node.runtimeContext.parameters[key] = param
  if (node.parameters?.[key] === undefined) {

    let value: T[K] | undefined = undefined
    if (typeof inital === "string") {
      value = inital as T[K]
    } else if (inital === false) {
      // keep udnefined
    } else if (typeof inital == "number") {
      if (param.type == "select") {
        if (param.options[inital]) {
          value = param.options[inital] as T[K]
        }
      } else {
        value = `${inital ?? ""}` as T[K]
      }
    }

    node.parameters[key] = value
  }
}