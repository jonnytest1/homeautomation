import type { NodeDefOptinos, NodeOptionTypes } from './typing/node-options';
import type { ElementNode as ELN, ExtendedJsonSchema, TypeImplementaiton } from './typing/generic-node-type';
export class ElementNodeImpl<T = { [optinoskey: string]: string }, P = Partial<NodeDefOptinos>> implements ELN<T, P> {

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



  checkInvalidations(typeImpl: TypeImplementaiton, prev: ELN<T, P> | null) {


    if (prev?.parameters) {
      const def = typeImpl.nodeDefinition()
      for (const key in def.options) {
        const opt = def.options[key]

        if (opt.invalidates) {
          if (prev?.parameters?.[key] && this?.parameters?.[key] && this?.parameters?.[key] !== prev?.parameters?.[key]) {
            for (const invalidator of opt.invalidates) {
              delete this.parameters[invalidator]
              delete this.runtimeContext?.parameters?.[invalidator]
            }
          }
        }
      }
    }

  }
  updateRuntimeParameter<K extends (keyof P & keyof T), V extends NodeOptionTypes & P[K]>(key: K, param: V, inital: number | string | false = 0) {

    this.runtimeContext.parameters ??= {}
    this.parameters ??= {}
    this.runtimeContext.parameters[key] = param
    if (this.parameters?.[key] === undefined) {

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
          debugger
          value = "" as T[K]
        }
      }

      this.parameters[key] = value
    }
  }

}