import type { NodeDefOptinos, NodeDefToRUntime, NodeDefToType } from './node-options'
import type { ElementNode } from './element-node'
import type { Callbacks } from './node-callbacks'
import type { NodeDefintion } from './node-definition'
import type { Schemata } from './schemata'
import type { NodeEvent } from '../node-event'
import type { ElementNodeImpl } from '../element-node'
import type { Subject } from 'rxjs'

type DefaultProps = {
  name: { type: "text" }
}

export type EvalNode<Opts extends NodeDefOptinos, S> = ElementNode<NodeDefToType<Opts & DefaultProps>, NodeDefToRUntime<Opts & DefaultProps>, S>



export type GenericSocketEvent = {
  type: string,
  ___reply: (evt) => void
}


export type NullTypeSubject = { type: string, response, param }


export type SubjectEvent<SocketMap extends { type: string, response, param }> = {
  [K in SocketMap["type"]]:
  {
    type: K,
    ___reply: (resp: (SocketMap & { type: K })["response"]) => void
  } & (SocketMap & { type: K })["param"]
}[SocketMap["type"]]

export type TypeImplSocket<T extends NullTypeSubject = NullTypeSubject> = Subject<SubjectEvent<T>>

export type TypeImplementaiton<Context = unknown, Globals extends NodeDefOptinos = NodeDefOptinos, Opts extends NodeDefOptinos = NodeDefOptinos, P = unknown, S = object, TypeS extends NullTypeSubject = NullTypeSubject> = {
  context_type?(c: Context): Context
  payload_type?(p: P): P
  server_context_type?(s: S): S
  messageSocket?: (socket: TypeImplSocket<TypeS>) => void
  process: (node: EvalNode<Opts, S>, data: NodeEvent<Context, P, Globals>, callbacks: Callbacks) => void | Promise<void>
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