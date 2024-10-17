import type { SelectorReturnType } from '../../../util/data-store/selector'
import type { nodeglobalsSelector } from '../generic-store/selectors'
import { column, primary, table } from 'hibernatets'

@table()

export class NodeBackup {


  @primary({ strategy: "custom" })
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


  static from(data: SelectorReturnType<typeof nodeglobalsSelector>, date: string) {
    const obj = new NodeBackup()
    obj.date = date
    obj.data = data
    return obj
  }
}