import type { NodeEventJsonData } from '../node-event'
import type { ElementNode } from '../typing/element-node'
import { column, primary, table } from 'hibernatets'


@table()

export class LastNodeEvent {


  @primary({ strategy: "custom" })
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
  event: NodeEventJsonData


  static from(node: ElementNode, event: NodeEventJsonData) {
    const obj = new LastNodeEvent()
    obj.nodeUuid = node.uuid
    obj.event = event
    return obj
  }
}