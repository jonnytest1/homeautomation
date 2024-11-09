import type { ElementNode } from './typing/element-node';

export type RecursiveCallTrace = {
  [connid: `Connection:${string}`]: {
    [typeanduuid: `Node:${string}`]: RecursiveCallTrace
  }
}
export type CallTrace = {
  nodes: Array<string>,
  callTrace: RecursiveCallTrace,
  callTraceRoot: RecursiveCallTrace,
  initContext: string,
  logIt: boolean
}
export function defaultCallTrace(node: ElementNode, initContext: string): CallTrace {
  let tr: RecursiveCallTrace = {}
  const root = tr;
  const nodes: Array<string> = [];


  if (node) {
    nodes.push(`type:${node.type}:${node.uuid}`)
    const subCalls = {

    }
    tr[`type:${node.type}:${node.parameters?.name}__:${node.uuid}`] = subCalls

    tr = subCalls


  }
  return {
    nodes: nodes,
    callTrace: tr,
    callTraceRoot: root,
    initContext,
    logIt: false
  }
}
