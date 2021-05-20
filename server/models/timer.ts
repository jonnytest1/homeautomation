import { Delayed, SenderResponse } from './connection-response';
import { FrontendWebsocket } from '../resources/frontend-update';
import { column, primary, save, table } from 'hibernatets';
import { getId } from 'hibernatets/utils';


@table()
export class Timer {

    static start<U>(thisArg: U, fncName: keyof U, timerData: Delayed<SenderResponse>, ...args) {
        const id = getId(thisArg)
        const className = thisArg.constructor.name;
        const timer = new Timer({
            startTimestamp: Date.now(),
            endtimestamp: Date.now() + timerData.time,
            args: [fncName, timerData.nestedObject, ...args],
            classId: id,
            className: className,
            data: timerData.sentData
        })
        save(timer)
            .then(() => {
                FrontendWebsocket.updateTimers()
            })
    }
    constructor(options?: { startTimestamp: number, endtimestamp: number, args: Array<unknown>, className: string, classId: number, data?}) {
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