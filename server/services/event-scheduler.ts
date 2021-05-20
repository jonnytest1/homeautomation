
import { Connection } from '../models/connection';
import { Sender } from '../models/sender';
import { Timer } from '../models/timer';
import { logKibana } from '../util/log';
import { LoadOptions } from 'hibernatets/load';
import { ConstructorClass } from 'hibernatets/interface/mapping';
import { load, queries } from 'hibernatets';

type CallbackClass = {
    classRef: ConstructorClass<unknown>;
    loadOptions?: LoadOptions<unknown>;
};

export class EventScheduler {

    schedulerInterval: NodeJS.Timeout

    callbackClasses: { [key: string]: CallbackClass } = {}

    constructor() {
        console.log("starting event scheduler")


        const callbackClasses: Array<CallbackClass> = [{
            classRef: Sender,
            loadOptions: {
                deep: {
                    connections: "TRUE = TRUE",
                }
            }
        }, {
            classRef: Connection,
            loadOptions: {
                deep: {
                    receiver: "TRUE=TRUE"
                }
            }
        }]

        for (const callbackDef of callbackClasses) {
            this.callbackClasses[callbackDef.classRef.name] = callbackDef;
        }


    }

    start() {
        this.checkTimers();
    }

    async checkTimers() {
        try {
            await this.callTimer();
        } catch (e) {
            logKibana("ERROR", "error in scheduler", e);
        }
        this.schedulerInterval = setTimeout(() => this.checkTimers(), 1000);
    }

    private async callTimer() {
        const timer = await load(Timer, "alerted='false' AND endtimestamp < UNIX_TIMESTAMP(NOW(3))*1000", undefined, { first: true });
        if (!timer) {
            return;
        }
        const timerArguments: Array<never> = JSON.parse(timer.arguments);
        const functionName: string = timerArguments.shift();
        const thisArgsObject = await load(this.callbackClasses[timer.timerClassName].classRef, +timer.timerClassId, undefined, { deep: true });
        try {
            await thisArgsObject[functionName](...timerArguments);
        } catch (e) {
            logKibana("ERROR", `error in timer execution function:'${functionName}' of ${timer.timerClassName}`, e);
        }
        timer.alerted = "true";
        await queries(timer);
    }
}