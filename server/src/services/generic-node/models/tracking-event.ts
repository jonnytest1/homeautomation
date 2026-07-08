import { column, primary, table } from 'hibernatets';

@table()
export class TrackingEvent {

  @primary()
  id: number

  @column({ size: "small" })
  nodeUuid: string

  @column({ size: "small" })
  nodeName: string

  @column({ size: "large" })
  payload: string

  @column({ size: "large" })
  context: string

  @column({ type: "date" })
  time_col: Date

  static create(evnt: {
    payload: unknown
    context?: Record<string, unknown>
  }, node: {
    uuid: string,
    parameters?: {
      name?: string
    }
  }) {
    const evt = new TrackingEvent()
    evt.time_col = new Date()
    evt.nodeUuid = node.uuid
    if (evnt.payload === undefined) {
      throw new Error("payload undefined")
    }



    evt.payload = JSON.stringify(evnt.payload)

    evt.nodeName = node.parameters?.name ?? '';

    const context: Record<string, string | number | boolean> = {}
    if (typeof evnt.context == "object") {
      for (const key in evnt.context) {
        const contextValue = evnt.context[key];
        if (typeof contextValue == "string" || typeof contextValue == "number" || typeof contextValue == "boolean") {
          context[key] = contextValue
        }
      }
    }
    evt.context = JSON.stringify(context)
    return evt;
  }
}