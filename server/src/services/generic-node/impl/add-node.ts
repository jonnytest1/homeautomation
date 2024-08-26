import { backendToFrontendStoreActions } from '../generic-store/actions';
import { genericNodeDataStore } from '../generic-store/reference';
import { typeImplementations } from '../type-implementations';
import type { ElementNode } from '../typing/element-node';


export async function addNode(node: ElementNode) {
  const typeImpl = typeImplementations.value[node.type];
  if (typeImpl) {
    node.runtimeContext ??= {};
    const nodeDef = typeImpl.nodeDefinition();
    node.runtimeContext.inputs = nodeDef.inputs;
    node.runtimeContext.outputs = nodeDef.outputs;
  }

  genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateNode({
    newNode: node,
  }));
}
