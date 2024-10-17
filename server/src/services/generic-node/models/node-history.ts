import type { SelectorReturnType } from '../../../util/data-store/selector'
import type { nodeDataSelector } from '../generic-store/selectors'
import { column, primary, table } from 'hibernatets'

@table({
  constraints: [{
    type: "unique",
    columns: ["date"]
  }]
})

export class NodeHistory {

  @primary()
  id: string


  @column()
  date: string

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
  data: SelectorReturnType<typeof nodeDataSelector>

  @column({ type: "date" })
  lastUpdate: Date

  static from(data: SelectorReturnType<typeof nodeDataSelector>) {
    const obj = new NodeHistory()

    const now = new Date()
    obj.date = now.toISOString().split("T")[0]
    obj.data = data
    obj.lastUpdate = now
    return obj
  }
}