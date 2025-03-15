import { backendToFrontendStoreActions, setServerContext } from './generic-store/actions';
import { genericNodeDataStore } from './generic-store/reference';
import type { EvalNode, TypeImplementaiton } from './typing/generic-node-type';
import type { ElementNode } from './typing/element-node';
import type { MapTypeToParam, NodeDefOptinos, NodeOptionTypes, PlaceHolder } from './typing/node-options';

export function updateServerContext<T, O extends NodeDefOptinos, K extends (keyof T & string)>(node: EvalNode<O, T>, opts: Partial<T>) {

  const k = Object.keys(opts)[0]

  genericNodeDataStore.dispatch(setServerContext({
    key: k,
    value: opts[k],
    nodeUuid: node.uuid
  }));
}


type SetNodeOption<T extends string> = {
  [key in T]: NodeOptionTypes
}
type SetNodeParamVAlue<K extends string, V extends NodeOptionTypes> = {
  [key in K]: MapTypeToParam<V, K>
}




export function setNodeParameter<T, K extends ((keyof T & string)), V extends T[K]>(
  node: ElementNode<T, unknown>,
  key: K,
  param: V,) {

  if (node.parameters && node.parameters[key] === param) {
    return
  }

  genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateParam({
    node: node.uuid,
    param: key,
    value: param as never
  }))


}

export function updateRuntimeParameter<T, P, K extends ((keyof P & keyof T & string)), V extends NodeOptionTypes & P[K]>(
  node: ElementNode<T, P>,
  key: K,
  param: V | PlaceHolder,
  inital: number | string | false | Array<string> = 0): asserts node is ElementNode<T, P> & {
    parameters: SetNodeParamVAlue<K, V>,
    runtimeContext: {
      parameters: SetNodeOption<K>
    }
  } {

  node.runtimeContext.parameters ??= {}
  node.parameters ??= {}

  if (JSON.stringify(node.runtimeContext.parameters[key]) !== JSON.stringify(param)) {

    node.runtimeContext.parameters[key] = param as P[K]

    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateParamDefinition({
      nodeUuid: node.uuid,
      param: key,
      value: param
    }))
  }



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
      } else if (inital) {

        value = `${inital}` as T[K]
      }
    } else if (inital instanceof Array) {
      if (param.type == "select") {
        value = JSON.stringify(inital) as T[K]
      }
    }
    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateParam({
      node: node.uuid,
      param: key,
      value: value as never
    }))
    node.parameters[key] = value as never
  }

}



export function checkInvalidations<T, P, K extends (keyof P & keyof T & string), V extends NodeOptionTypes & P[K]>(typeImpl: TypeImplementaiton, node: ElementNode<T, P>, prev: ElementNode<T, P> | null) {
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

