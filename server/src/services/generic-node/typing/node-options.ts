
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
