
export type Text = {
  type: "text"
  multiline?: true
}

export type NumberCfg = {
  type: "number",
  min?: number,
  max?: number
}
export type BtnCfg = {
  type: "button",
  text?: string
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
  multiple?: boolean
}


declare const pInst: unique symbol
export type PlaceHolder<T extends NodeOptionTypes = NodeOptionInstanceTypes> = {
  type: "placeholder",
  of: Exclude<NodeOptionTypes<string>["type"], "placeholder"> | Array<Exclude<NodeOptionTypes<string>["type"], "placeholder">> | "unknown"
  [pInst]?: T
}

export function wrapPlaceholder<Of extends NodeOptionTypes>() {
  return <T extends PlaceHolder<Of>>(p: T) => {
    return p as T & PlaceHolder<Of>
  }
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
export type HiddenUnlessValue = {
  hideWithoutValue?: boolean
}
export type PlaceholderType<T extends PlaceHolder<any>> = T["of"] extends Array<infer U>
  ? U
  : T["of"] extends "unknown"
  ? unknown
  : T["of"]



export type NodeOptionInstanceTypes = Select | Text | Code | Frame | NumberCfg | BooleanCfg | BtnCfg
export type NodeOptionTypes<Keys extends string = string> = (NodeOptionInstanceTypes | PlaceHolder)
  & Order
  & Invalidated<Keys>
  & Titled
  & HiddenUnlessValue

export type NodeOptionTypeWithOptionalName = NodeOptionTypes & { name?: string }
export type NodeOptionTypeWithName = NodeOptionTypes & { name: string }

export type NodeDefOptinos<K extends string = string> = {
  [key in K]: NodeOptionTypes<K>
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
  : T["type"] extends "button"
  ? string : never


export type MapTypeToParam<T extends NodeOptionTypes<string>, Key extends string> =
  T extends PlaceHolder<infer U>
  ? NodeOptionInstanceTypes extends U ? NodeDefType<NodeOptionTypes<string> & { type: PlaceholderType<T> }> : NodeDefType<U>
  : NodeDefType<T>



export type NodeDefToType<N extends NodeDefOptinos> = {
  [key in keyof N]?: MapTypeToParam<N[key], key & string>
}

//  N[key] extends PlaceHolder ? NodeDefType<NodeOptionTypes<string> & { type: PlaceholderType<N[key]> }> : NodeDefType<N[key]>


export type NodeDefToRUntime<N extends NodeDefOptinos> = {
  [key in keyof N]?: N[key] extends PlaceHolder<infer S>
  ? NodeOptionInstanceTypes extends S ?

  (NodeOptionTypes<string> & { type: PlaceholderType<N[key]> })
  : S
  : N[key]
}
