import type { NodeDefOptinos } from './typing/node-options';
import type { Callbacks } from './typing/node-callbacks';
import type { ElementNode } from './typing/element-node';
import type { NodeEvent } from './node-event';
export class ElementNodeImpl<T = { [optinoskey: string]: string }, P = Partial<NodeDefOptinos>> implements ElementNode<T, P>, Callbacks {

  parameters?: Partial<T & { name?: string }> | undefined;
  position: { x: number; y: number; };
  type: string;
  uuid: string;
  runtimeContext: ElementNode<T, P>["runtimeContext"]
  globalContext?: NodeDefOptinos | undefined;



  constructor(node: ElementNode<T, P>, callbacks: Callbacks) {
    Object.assign(this, node)
    Object.assign(this, callbacks)
  }

  declare continue: (evt: NodeEvent<unknown, unknown, NodeDefOptinos>, index?: number | undefined) => void;
  declare updateNode: () => void;
}


export function nodeDescriptor(node: ElementNode<{ name?}, unknown, unknown>) {
  if (node.parameters?.name) {
    return `${node.uuid} (${node.parameters.name})`
  }
  return node.uuid
}



export function nodeTypeName(node: ElementNode) {
  return "_" + node.uuid.replace(/-/g, "_")
}



