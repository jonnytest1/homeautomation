import type { NodeDefOptinos } from './node-options';


export type NodeDefintion<G extends NodeDefOptinos = NodeDefOptinos, O extends NodeDefOptinos = NodeDefOptinos> = {
  outputs?: number;
  inputs?: number;
  type: string;
  options?: O;
  globalConfig?: G;
  page?: string;
};
