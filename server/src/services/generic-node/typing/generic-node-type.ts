import type { NodeDefOptinos, NodeDefToRUntime, NodeDefToType } from './node-options'
import type { NodeEvent } from '../node-event'
import type { ElementNodeImpl } from '../element-node'
import type { JSONSchema6 } from 'json-schema'

export type NodeDefintion<G extends NodeDefOptinos = NodeDefOptinos, O extends NodeDefOptinos = NodeDefOptinos> = {
  outputs?: number,
  inputs?: number,
  type: string
  options?: O
  globalConfig?: G
}

export type Callbacks = {
  continue: (evt: NodeEvent, index?: number) => void
  updateNode(frontendEmit?: boolean)
}

type DefaultProps = {
  name: { type: "text" }
}

export type EvalNode<Opts extends NodeDefOptinos, S> = ElementNode<NodeDefToType<Opts & DefaultProps>, NodeDefToRUntime<Opts & DefaultProps>, S>


export type TypeImplementaiton<Context = unknown, Globals extends NodeDefOptinos = NodeDefOptinos, Opts extends NodeDefOptinos = NodeDefOptinos, P = unknown, S = object> = {
  context_type?(c: Context): Context
  payload_type?(p: P): P
  server_context_type?(s: S): S
  process: (node: EvalNode<Opts, S>, data: NodeEvent<Context, P, Globals>, callbacks: Callbacks) => void | Promise<void>
  nodeDefinition: () => NodeDefintion<Globals, Opts>
  nodeChanged?: (this: TypeImplementaiton, node: ElementNodeImpl<NodeDefToType<Opts>, NodeDefToRUntime<Opts>>, prevNode: ElementNode<NodeDefToType<Opts>> | null) => void | Promise<void>
  connectionTypeChanged?(node: EvalNode<Opts, S>, schema: Schemata): void | Promise<void>
  initializeServer?(nodes: Array<ElementNodeImpl<NodeDefToType<Opts>>>, globals: NodeDefToType<Globals>): void | Promise<void>
  unload?(nodeas: Array<EvalNode<Opts, S>>, globals: NodeDefToType<Globals>): void | Promise<void>
  _file?: string
}



export type ExtendedJsonSchema = JSONSchema6 & { merged?: boolean, _optional?: Array<string> }


export type Schemata = {
  jsonSchema: ExtendedJsonSchema
  dts: string
  globalModDts?: string
  mainTypeName: "Main"
}

export type ElementNode<T = { [optinoskey: string]: string }, P = NodeDefOptinos, S = object> = {
  parameters?: Partial<T>
  position: {
    x: number,
    y: number
  },
  view?: string,
  type: NodeDefintion["type"]
  uuid: string,
  serverContext?: S
  runtimeContext: {
    inputSchema?: Schemata
    outputSchema?: Schemata
    editorSchema?: {
      dts: string,
      globals?: string
    }
    inputs?: number,
    outputs?: number
    info?: string
    parameters?: Partial<P>

    /*connections?: {
      incoming: Array<Connection & { node?: ElementNode }>,
      outgoing: Array<Connection & { node?: ElementNode }>,
    }*/
  },
  globalContext?: NodeDefOptinos
}

export interface ConnectorDefintion {
  uuid: string;
  index: number;
  error?: string
}

export type Connection = {
  source: ConnectorDefintion
  target: ConnectorDefintion

}


export type NodeData = {
  nodes: Array<ElementNode>,
  connections: Array<Connection>
  globals: NodeDefToType<NodeDefOptinos>
}


export type PreparedNodeData = {
  connectorMap: Record<string, { [outputindex: number]: Array<ConnectorDefintion> }>
  targetConnectorMap: Record<string, { [inputindex: number]: Array<ConnectorDefintion> }>
  nodeMap: Record<string, ElementNode>
  typeImpls: Record<string, TypeImplementaiton>
}
/*
export type SchemaCollection = {
  schemaCache: string
  dts: string,
  //zodValidator: z.ZodType
  mainTypeName: "Main"
}
*/
export type NodeEventTimes = Record<string, { input?: number, output?: number }>