import { column, primary, table } from 'hibernatets';

@table()
export class Timer {

    constructor(options?: { startTimestamp: number, endtimestamp: number, args: Array<Object>, className: string, classId: number, data?}) {
        if (options) {
            this.startTimestamp = options.startTimestamp
            this.endtimestamp = options.endtimestamp
            this.arguments = JSON.stringify(options.args);
            this.timerClassId = options.classId;
            this.timerClassName = options.className
            if (options.data) {
                this.data = JSON.stringify(options.data);
            }
        }
    }

    @primary()
    id;

    @column()
    alerted: 'true' | 'false' = 'false'

    @column()
    timerClassName: string

    @column({
        type: "number",
        size: "large"
    })
    timerClassId: number

    @column({
        size: 'large'
    })
    data: string

    @column({
        type: "number",
        size: "large"
    })
    startTimestamp: number

    @column({
        type: "number",
        size: "large"
    })
    endtimestamp: number;


    @column({
        size: 'large'
    })
    arguments: string

}