import type { SelectorReturnType } from '../../../util/data-store/selector'
import type { nodeglobalsSelector } from '../generic-store/selectors'
import { column, primary, table } from 'hibernatets'

@table({
  constraints: [{
    type: "unique",
    columns: ["date"]
  }]
})

export class NodeContextData {

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
  data: SelectorReturnType<typeof nodeglobalsSelector>

  @column({ type: "date" })
  lastUpdate: Date

  static from(data: SelectorReturnType<typeof nodeglobalsSelector>) {
    const obj = new NodeContextData()

    const now = new Date()
    obj.date = now.toISOString().split("T")[0]
    obj.data = data
    obj.lastUpdate = now
    return obj
  }
}