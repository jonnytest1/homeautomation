import type { ElementNode } from '../typing/element-node'
import { column, primary, table } from 'hibernatets'

@table({
  constraints: [{
    type: "unique",
    columns: ["nodeUuid"]
  }]
})

export class NodeEntry {

  @primary()
  id: string


  @column()
  nodeUuid: string

  @column({
    type: "text",
    size: "large",
    transformations: {
      async loadFromDbToProperty(dbData) {
        return JSON.parse(dbData)
      },
      async saveFromPropertyToDb(obj) {
        return JSON.stringify(obj)
      },
    }
  })
  node: ElementNode

  @column({ type: "date" })
  lastUpdate: Date


  @column({ type: "boolean" })
  deleted = false

  static from(node: ElementNode) {
    const obj = new NodeEntry()

    const now = new Date()
    obj.node = node
    obj.nodeUuid = node.uuid
    obj.lastUpdate = now
    return obj
  }
}