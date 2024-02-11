import type { NodeEvent } from './node-event'
import type { z } from 'zod'
import type { JSONSchema6 } from 'json-schema'


export type Text = {
  type: "text"
}
export type Code = {
  type: "monaco"
  default?: string
}

export type Select<T extends string = string> = {
  type: "select",
  options: Array<T> | ReadonlyArray<T>
  initial?: string
}
export type PlaceHolder = {
  type: "placeholder",
  of: Exclude<NodeOptionTypes["type"], "placeholder">
}

type Order = {
  order?: number
}

export type NodeOptionTypes = (Select | Text | Code | PlaceHolder) & Order

export type NodeDefOptinos = {
  [name: string]: NodeOptionTypes
}
export type NodeDefintion<G extends NodeDefOptinos = NodeDefOptinos, O extends NodeDefOptinos = NodeDefOptinos> = {
  outputs?: number,
  inputs?: number,
  type: string
  options?: O
  globalConfig?: G
}





type NodeDefType<T extends NodeOptionTypes> = T["type"] extends "text"
  ? string
  : T extends Select
  ? T["options"][number]
  : T["type"] extends "monaco"
  ? string
  : never

export type NodeDefToType<N extends NodeDefOptinos> = {
  [key in keyof N]?: N[key] extends PlaceHolder ? NodeDefType<NodeOptionTypes & { type: N[key]["of"] }> : NodeDefType<N[key]>
}


export type NodeEventData<C = unknown, T = unknown> = {
  payload: T
  context: C,
}

export type Callbacks = {
  continue: (evt: NodeEvent, index?: number) => void
  updateNode()
}


export type TypeImplementaiton<Context = unknown, Globals extends NodeDefOptinos = NodeDefOptinos, Opts extends NodeDefOptinos = NodeDefOptinos> = {
  process: (node: ElementNode<NodeDefToType<Opts>>, data: NodeEvent<Context, unknown, Globals>, callbacks: Callbacks) => void | Promise<void>
  nodeDefinition: () => NodeDefintion<Globals, Opts>
  nodeChanged?: (node: ElementNode<NodeDefToType<Opts>>, prevNode: ElementNode<NodeDefToType<Opts>> | null) => void | Promise<void>
  connectionTypeChanged?(node: ElementNode<NodeDefToType<Opts>>, schema: SchemaCollection): void | Promise<void>
}



export type ExtendedJsonSchema = JSONSchema6 & { merged?: boolean }

export type ElementNode<T = { [optinoskey: string]: string }, P = NodeDefOptinos> = {
  parameters?: T
  position: {
    x: number,
    y: number
  },
  type: NodeDefintion["type"]
  uuid: string,

  runtimeContext: {
    inputSchema?: {
      jsonSchema: ExtendedJsonSchema
      dts: string
    }
    outputSchema?: {
      jsonSChema: ExtendedJsonSchema
      dts: string
    }
    info?: string
    lastEvent?: unknown
    lastEventTime?: number
    lastOutputEventTime?: number
    parameters?: P

    connections?: {
      incoming: Array<Connection & { node?: ElementNode }>,
      outgoing: Array<Connection & { node?: ElementNode }>,
    }
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
  target?: ConnectorDefintion

}


export type NodeData = {
  nodes: Array<ElementNode>,
  connections: Array<Connection>
  globals: NodeDefToType<NodeDefOptinos>
}


export type PreparedNodeData = {
  connectorMap: Record<string, Array<ConnectorDefintion>>
  targetConnectorMap: Record<string, Array<ConnectorDefintion>>
  nodeMap: Record<string, ElementNode>
  typeImpls: Record<string, TypeImplementaiton>
}

export type SchemaCollection = {
  schemaCache: string
  dts: string,
  zodValidator: z.ZodType
  mainTypeName: "Main"
}