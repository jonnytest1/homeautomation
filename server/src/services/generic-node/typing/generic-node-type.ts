import type { NodeDefOptinos, NodeDefToRUntime, NodeDefToType } from './node-options'
import type { ElementNode } from './element-node'
import type { Callbacks } from './node-callbacks'
import type { NodeDefintion } from './node-definition'
import type { Schemata } from './schemata'
import type { JSONSchema, SimpleSchemaType } from './jsonschema-type'
import type { NodeEvent } from '../node-event'
import type { ElementNodeImpl } from '../element-node'
import type { Subject } from 'rxjs'

type DefaultProps = {
  name: { type: "text" }
}

export type EvalNode<Opts extends NodeDefOptinos, S> = ElementNode<NodeDefToType<Opts & DefaultProps>, NodeDefToRUntime<Opts & DefaultProps>, S>


export type NullTypeSubject = { type: string, response: unknown, param: unknown }


export type SubjectEvent<SocketUnion extends NullTypeSubject> = {
  [K in SocketUnion["type"]]:
  {
    type: K,
    ___reply: (resp: (SocketUnion & { type: K })["response"]) => void
  } & (SocketUnion & { type: K })["param"]
}[SocketUnion["type"]]

export type TypeImplSocket<T extends NullTypeSubject = NullTypeSubject> = Subject<SubjectEvent<T>>

export type TypeImplementaiton<Context extends JSONSchema = { type: "object" }, Globals extends NodeDefOptinos = NodeDefOptinos, Opts extends NodeDefOptinos = NodeDefOptinos, P = unknown, S = object, TypeS extends NullTypeSubject = NullTypeSubject> = {
  context_type?(): Context
  payload_type?(p: P): P
  server_context_type?(s: S): S
  messageSocket?: (socket: TypeImplSocket<TypeS>) => void
  process: (node: EvalNode<Opts, S>, data: NodeEvent<SimpleSchemaType<Context>, P, Globals>, callbacks: Callbacks) => void | Promise<void>
  nodeDefinition: () => NodeDefintion<Globals, Opts>
  nodeChanged?: (this: TypeImplementaiton, node: ElementNodeImpl<NodeDefToType<Opts>, NodeDefToRUntime<Opts>>, prevNode: ElementNode<NodeDefToType<Opts>> | null) => void | Promise<void>
  connectionTypeChanged?(node: EvalNode<Opts, S>, schema: Schemata): void | Promise<void>
  targetConnectionTypeChanged?(node: EvalNode<Opts, S>, schema?: Schemata): void | Promise<void>
  initializeServer?(nodes: Array<ElementNodeImpl<NodeDefToType<Opts>>>, globals: NodeDefToType<Globals>): void | Promise<void>
  unload?(nodeas: Array<EvalNode<Opts, S>>, globals: NodeDefToType<Globals>): void | Promise<void>
  _file?: string
  _socket?: TypeImplSocket<TypeS>
}



export interface ConnectorDefintion {
  uuid: string;
  index: number;
  error?: string

  connectionUuid?: string
}

export type Connection = {
  source: ConnectorDefintion
  target: ConnectorDefintion
  uuid: string
}


export type NodeData = {
  nodes: Array<ElementNode>,
  connections: Array<Connection>
  globals: NodeDefToType<NodeDefOptinos>
  version: number
}


export type PreparedNodeData = {
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
export type NodeEventTimes = Record<string, {
  input?: number,
  output?: number,
  [key: `input${number}`]: number
  [key: `output${number}`]: number
}>