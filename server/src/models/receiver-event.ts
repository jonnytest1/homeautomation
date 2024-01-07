import { column, primary, table } from 'hibernatets';

@table()
export class ReceiverEvent {
  @primary()
  id;

  @column()
  type: 'action' | "state";

  @column({
    size: 'medium'
  })
  data: string;

  @column()
  checked: 'true' | 'false' = 'false';

  @column({
    type: "number",
    size: "large"
  })
  timestamp

  constructor(data?) {
    if (data) {
      this.type = data.action ?? 'action';
      this.data = JSON.stringify(data);
      this.timestamp = Date.now()
    }
  }
} 