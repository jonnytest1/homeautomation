import { sharedPool } from '../models/db-state';
import { Sender } from '../models/sender';
import { Sound } from '../models/sound';
import { TscCompiler } from '../util/tsc-compiler';
import { loadOne } from 'express-hibernate-wrapper';
import { load } from 'hibernatets';

class SenderLoader {
  readonly cacheTime = 1000 * 60 * 5;

  lastAllLoaded: number
  senderCache: Record<string, {
    loaded: number,
    value: Sender
  }> = {

    }
  async loadSender(deviceKey: string) {
    const cacheVal = this.senderCache[deviceKey];
    if (!cacheVal || (cacheVal.loaded + this.cacheTime) < Date.now()) {
      const twoMonthsAgo = Date.now() - (1000 * 60 * 60 * 24 * 60);
      const loadedSender = await loadOne(Sender, s => s.deviceKey = deviceKey, [], {
        deep: {
          connections: "TRUE = TRUE",
          events: "`timestamp` > " + twoMonthsAgo,
          batteryEntries: "`timestamp` > " + twoMonthsAgo,
          transformation: "TRUE = TRUE",
          receiver: "TRUE = TRUE",
        },
        interceptArrayFunctions: true,
        db: sharedPool
      })
      this.senderCache[deviceKey] = {
        loaded: Date.now(),
        value: loadedSender
      }
      return loadedSender
    }
    return cacheVal.value


  }


  async loadSenders() {

    const twoMonthsAgo = Date.now() - (1000 * 60 * 60 * 24 * 60);
    const [senders, sounds] = await Promise.all([
      (async () => {
        if (this.lastAllLoaded && this.lastAllLoaded + this.cacheTime > Date.now()) {
          return Object.values(this.senderCache).map(c => c.value)
        }
        const senders = await load(Sender, 'true = true', [twoMonthsAgo], {
          deep: {
            connections: "TRUE = TRUE",
            events: "`timestamp` > " + twoMonthsAgo,
            batteryEntries: "`timestamp` > " + twoMonthsAgo,
            transformation: "TRUE = TRUE",
            receiver: "TRUE = TRUE",
          }
        })
        this.lastAllLoaded = Date.now()
        for (const sender of senders) {
          this.senderCache[sender.deviceKey] = {
            loaded: Date.now(),
            value: sender
          }
        }
        return senders
      })(),
      load(Sound, 'true=true')
    ])


    const definitionFile = TscCompiler.responseINterface
      ?.replace(
        "type soundListRuntime = string",
        `type soundListRuntime = ${sounds.map(s => `'${s.key}'`).join(' | ')}`)


    await Promise.all(senders.map(async sender => {
      sender.transformation.forEach(tr => tr.definitionFile = definitionFile)
    }))

    return senders
  }
}

export const senderLoader = new SenderLoader();