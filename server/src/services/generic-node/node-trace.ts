import type { ElementNode } from './typing/element-node';
import type { EvalNode } from './typing/generic-node-type';
import type { NodeDefOptinos } from './typing/node-options';
import type { CallTrace, RecursiveCallTrace } from './typing/trace';


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


export function nestedCallTrace<O extends NodeDefOptinos, R>(node: EvalNode<O, R>, trace: CallTrace, traceName: string): CallTrace {
  trace.callTrace[`Connection:${traceName}`] ??= {}
  const connectionTrace: RecursiveCallTrace = {}
  trace.callTrace[`Connection:${traceName}`][`Node:${node.type}:${node.parameters?.name}__${node.uuid}`] = connectionTrace

  return {
    ...trace,
    callTrace: connectionTrace,

  }
}

