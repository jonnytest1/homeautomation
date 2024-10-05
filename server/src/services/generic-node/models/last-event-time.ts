import { column, table } from 'hibernatets';




type IndexString = "" | `${number}`

type KeyIndex = `${"input" | "output"}${IndexString}`

@table({
  constraints: [{
    type: "unique",
    columns: ["nodeUuid", "keyindex"]
  }]
})

export class LastEventTime {


  @column()
  nodeUuid: string

  @column()
  keyindex: KeyIndex


  @column({
    type: "date",
  })
  timestamp: Date


  static from(node: string, key: KeyIndex, ts: number) {
    const evt = new LastEventTime()
    evt.nodeUuid = node
    evt.timestamp = new Date(ts)
    evt.keyindex = key
    return evt
  }

}