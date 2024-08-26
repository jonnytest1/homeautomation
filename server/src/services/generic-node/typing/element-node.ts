import type { Schemata } from './schemata';
import type { NodeDefintion } from './node-definition';
import type { NodeDefOptinos } from './node-options';


export type ElementNode<T = { [optinoskey: string]: string; }, P = NodeDefOptinos, S = object> = {
  parameters?: Partial<T & { name?: string; }>;
  position: {
    x: number;
    y: number;
  };
  view?: string;
  type: NodeDefintion["type"];
  uuid: string;
  serverContext?: S;
  runtimeContext: {
    inputSchema?: Schemata;
    outputSchema?: Schemata;
    editorSchema?: {
      dts: string;
      globals?: string;
    };
    inputs?: number;
    outputs?: number;
    info?: string;
    parameters?: Partial<P>;

  };
  globalContext?: NodeDefOptinos;
};
