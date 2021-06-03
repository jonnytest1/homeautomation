import { column, primary, table } from 'hibernatets';

@table()
export class BatteryLevel {

    @primary()
    readonly id;

    @column({
        type: 'number'
    })
    level: number;

    @column({
        type: 'number',
        size: 'large'
    })
    timestamp: number;

    @column({
        size: 'medium'
    })
    amounts: string;

    constructor(...amounts: Array<string | number>) {
        this.amounts = JSON.stringify(amounts);
        const sum = amounts.map(amount => +amount)
            .reduce((a, b) => a + b, 0);
        this.level = sum / amounts.length;
        this.timestamp = Date.now();
    }
}