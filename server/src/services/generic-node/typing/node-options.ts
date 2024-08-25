import type { ExtendedJsonSchema } from './generic-node-type'

export type Text = {
  type: "text"
  multiline?: true
}

export type NumberCfg = {
  type: "number",
  min?: number,
  max?: number
}
export type BooleanCfg = {
  type: "boolean"
  defaultV?: boolean
}

export type Code = {
  type: "monaco",
  mode?: "html"
  default?: string
}

export type Select<T extends string = string> = {
  type: "select",
  readonly options: ReadonlyArray<T> //  Array<T> | 
  optionDisplayNames?: Array<string>
  initial?: string
}
export type PlaceHolder = {
  type: "placeholder",
  of: Exclude<NodeOptionTypes<string>["type"], "placeholder"> | Array<Exclude<NodeOptionTypes<string>["type"], "placeholder">> | "unknown"
}

export type Frame = {
  type: "iframe"
  document: string,
  data?: unknown
}


type Order = {
  /**
   * defaults to 1 
   * heigher moves up
   */
  order?: number
}


type Invalidated<T extends string> = {
  invalidates?: Array<T>
}
type Titled = {
  title?: string
}

type PlaceholderType<T extends PlaceHolder> = T["of"] extends Array<infer U> ? U : T["of"] extends "unknown" ? unknown : T["of"]

export type NodeOptionTypes<Keys extends string = string> = (Select | Text | Code | PlaceHolder | Frame | NumberCfg | BooleanCfg)
  & Order
  & Invalidated<Keys>
  & Titled

export type NodeOptionTypeWithOptionalName = NodeOptionTypes & { name?: string }
export type NodeOptionTypeWithName = NodeOptionTypes & { name: string }

export type NodeDefOptinos = {
  [name: string]: NodeOptionTypes
}



type NodeDefType<T extends NodeOptionTypes<string>> =
  T["type"] extends "number"
  ? string
  : T["type"] extends "text"
  ? string
  : T extends Frame
  ? string
  : T extends Select
  ? T["options"][number]
  : T["type"] extends "monaco"
  ? string
  : never


export type MapTypeToParam<T extends NodeOptionTypes<string>, Key extends string> =
  T extends PlaceHolder
  ? NodeDefType<NodeOptionTypes<string> & { type: PlaceholderType<T> }>
  : NodeDefType<T>

export type NodeDefToType<N extends NodeDefOptinos> = {
  [key in keyof N]?: MapTypeToParam<N[key], key & string>
}

//  N[key] extends PlaceHolder ? NodeDefType<NodeOptionTypes<string> & { type: PlaceholderType<N[key]> }> : NodeDefType<N[key]>


export type NodeDefToRUntime<N extends NodeDefOptinos> = {
  [key in keyof N]?: N[key] extends PlaceHolder ? NodeOptionTypes<string> & { type: PlaceholderType<N[key]> } : N[key]
}



export function argumentTypeToJsonSchema(arg: NodeOptionTypes<string>): ExtendedJsonSchema {
  if (arg.type === "select") {
    return {
      type: "string",
      enum: [...arg.options]
    }
  } else if (arg.type === "number") {
    return {
      type: "number"
    }
  } else if (arg.type == "text") {
    return {
      type: "string"
    }
  } else if (arg.type == "boolean") {
    return {
      type: "boolean"
    }
  } else if (arg.type === "monaco" && arg.mode === "html") {
    return {
      type: "string"
    }
  } else {
    throw new Error("invalid argument type " + arg.type)
  }

}