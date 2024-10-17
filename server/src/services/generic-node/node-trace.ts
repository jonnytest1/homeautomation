import type { ElementNode } from './typing/element-node';

export type RecursiveCallTrace = Record<string, Array<RecursiveCallTrace>>
export type CallTrace = {
  nodes: Array<string>,
  callTrace: RecursiveCallTrace,
  callTraceRoot: RecursiveCallTrace,
  initContext: string
}
export function defaultCallTrace(node: ElementNode, initContext: string): CallTrace {
  const tr: RecursiveCallTrace = {}
  const nodes: Array<string> = [];

  if (node) {
    nodes.push(node.uuid)
    tr[node.uuid] = []
  }
  return {
    nodes: nodes,
    callTrace: tr,
    callTraceRoot: tr,
    initContext
  }
}
