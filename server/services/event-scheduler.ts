
import { Connection } from '../models/connection';
import { Sender } from '../models/sender';
import { Timer } from '../models/timer';
import { logKibana } from '../util/log';
import { LoadOptions } from 'hibernatets/load';
import { ConstructorClass } from 'hibernatets/interface/mapping';
import { load, queries } from 'hibernatets';

export class EventScheduler {

    schedulerInterval: NodeJS.Timeout

    callbackClasses: { [key: string]: { classRef: ConstructorClass<unknown>, loadOptions?: LoadOptions<unknown> } } = {}

    constructor() {
        console.log("starting event scheduler")
        this.checkTimers();

        const callbackClasses: Array<{ classRef: ConstructorClass<unknown>, loadOptions?: LoadOptions<unknown> }> = [
            {
                classRef: Sender,
                loadOptions: {
                    deep: {
                        connections: "TRUE = TRUE",
                    }
                }
            },
            {
                classRef: Connection,
                loadOptions: {
                    deep: {
                        receiver: "TRUE=TRUE"
                    }
                }
            }
        ]

        for (const callbackDef of callbackClasses) {
            this.callbackClasses[callbackDef.classRef.name] = callbackDef;
        }
    }


    async checkTimers() {
        try {
            const timers = await load(Timer, "alerted='false' AND endtimestamp < UNIX_TIMESTAMP(NOW(3))*1000")
            await Promise.all([timers.map(async timer => {
                const timerArguments: Array<never> = JSON.parse(timer.arguments);
                const functionName: string = timerArguments.shift();
                const thisArgsObject = await load(this.callbackClasses[timer.timerClassName].classRef, +timer.timerClassId, undefined, { deep: true })
                try {
                    await thisArgsObject[functionName](...timerArguments)
                } catch (e) {
                    logKibana("ERROR", `error in timer execution function:'${functionName}' of ${timer.timerClassName}`, e);
                }
                timer.alerted = "true";
                await queries(timer);
            })])
        } catch (e) {
            logKibana("ERROR", "error in scheduler", e);
        }
        this.schedulerInterval = setTimeout(() => this.checkTimers(), 800);
    }
}