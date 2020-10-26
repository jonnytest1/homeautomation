import { column, primary, table } from 'hibernatets';

@table()
export class EventHistory {

    @primary()
    id;

    @column()
    type: 'trigger';

    @column({
        size: 'medium'
    })
    data: string;

    @column()
    checked: 'true' | 'false' = 'false';

    constructor(data?) {
        if (data) {
            this.type = 'trigger';
            this.data = JSON.stringify(data);
        }
    }
}