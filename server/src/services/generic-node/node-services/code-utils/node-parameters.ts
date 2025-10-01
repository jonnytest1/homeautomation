import { updateServerContext } from '../../element-node-fnc';
import type { EvalNode } from '../../typing/generic-node-type';
import type { NodeDefOptinos } from '../../typing/node-options';

const paramPrefix = "param_";
export function nodeContext<O extends NodeDefOptinos, R>(node: EvalNode<O, R>) {

  const params: Record<string, unknown> = {}
  if (node.serverContext) {
    for (const key in node.serverContext) {
      if (key.startsWith(paramPrefix)) {
        params[key] = node.serverContext![key.split(paramPrefix)[1]]
      }
    }
  }
  const paramObj = {
    ...params,
    set: (key: string, value: unknown) => {
      paramObj[key] = value
      updateServerContext(node, {
        [`${paramPrefix}${key}`]: value
      } as Partial<R>)
    }
  }
  return paramObj
}