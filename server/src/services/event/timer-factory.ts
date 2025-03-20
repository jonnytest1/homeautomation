import type { EventTypes } from './event-type';
import type { ConditionalServiceType } from './service-map';
import type { Delayed, SenderResponse } from '../../models/connection-response';
import { Timer } from '../../models/timer';
import { FrontendWebsocket } from '../../resources/frontend-update';
import { getId } from 'hibernatets/utils';
import { save } from 'hibernatets';

export class TimerFactory {
  static create<U extends object, S extends ConditionalServiceType<U>>(thisArg: U, fncName: keyof U | keyof S, timerData: Delayed<SenderResponse>, ...args) {
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


  static createCallback<T extends EventTypes, S>(callbackClassName: T, timerData: Delayed<S>, classId: "shown" | "hidden" = "hidden") {

    const timer = new Timer({
      startTimestamp: Date.now(),
      endtimestamp: Date.now() + timerData.time,
      args: ["-", timerData.nestedObject],
      classId: classId === "shown" ? -2 : -1,
      className: callbackClassName,
      data: timerData.sentData
    })
    save(timer)
      .then(() => {
        FrontendWebsocket.updateTimers()
      })
    return timer
  }
}