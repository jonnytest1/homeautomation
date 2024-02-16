
import { SenderTriggerService } from './sender-trigger-service';
import { Connection } from '../models/connection';
import { Sender } from '../models/sender';
import { Timer } from '../models/timer';
import { logKibana } from '../util/log';
import type { LoadOptions } from 'hibernatets/load';
import type { ConstructorClass } from 'hibernatets/interface/mapping';
import { load, queries } from 'hibernatets';

type CallbackClass<T = unknown> = {
  classRef: ConstructorClass<T>;
  loadOptions?: LoadOptions<unknown>;
  service?: new (classRef: T) => T
};

export class EventScheduler {

  schedulerInterval: NodeJS.Timeout

  callbackClasses: { [key: string]: CallbackClass } = {}


  repeatedFailures?: number

  constructor() {
    console.log("starting event scheduler")


    const callbackClasses: Array<CallbackClass> = [{
      classRef: Sender,
      service: SenderTriggerService,
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
      this.repeatedFailures = undefined
    } catch (e) {
      this.repeatedFailures ??= 1;
      this.repeatedFailures++;
      if (this.repeatedFailures && this.repeatedFailures > 4) {
        logKibana("ERROR", "error in scheduler", e);
      }
    }
    this.schedulerInterval = setTimeout(() => this.checkTimers(), 1000);
  }

  private async callTimer() {
    const timer = await load(Timer, "alerted='false' AND endtimestamp < UNIX_TIMESTAMP(NOW(3))*1000", [], {
      first: true
    });
    if (!timer) {
      return;
    }
    const timerArguments = JSON.parse(timer.arguments) as [string, never];
    const functionName: string = timerArguments.shift() as string;
    let thisArgsObject = await load<unknown>(this.callbackClasses[timer.timerClassName].classRef, +timer.timerClassId, undefined, {
      deep: true
    }) as Sender | Connection;
    try {
      const callbackClass = this.callbackClasses[timer.timerClassName] as CallbackClass<Sender | Connection>
      if (callbackClass.service) {
        thisArgsObject = new callbackClass.service(thisArgsObject);
      }
      await (thisArgsObject)[functionName](...timerArguments);
    } catch (e) {
      logKibana("ERROR", `error in timer execution function:'${functionName}' of ${timer.timerClassName}`, e);
    }
    timer.alerted = "true";
    await queries(timer);
  }
}