import { Connection, ElementNode } from '../settings/interfaces'

export type ActiveElement = {
  type: "node",
  node: ElementNode
} | { type: "connection", con: Connection }