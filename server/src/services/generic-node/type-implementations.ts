import type { TypeImplementaiton } from './typing/generic-node-type';
import type { NodeDefintion } from './typing/node-definition';
import { BehaviorSubject } from 'rxjs';


export const typeImplementations = new BehaviorSubject<Record<string, TypeImplementaiton>>({});




export function getNodeDefintions(): Record<string, NodeDefintion> {
  const nodeDefs: Record<string, NodeDefintion> = {};
  for (const key in typeImplementations.value) {
    nodeDefs[key] = typeImplementations.value[key].nodeDefinition();
  }
  return nodeDefs;
}

