import type { ConnectionResponse, SenderResponse } from './connection-response';
import { EvaluatedData } from './evaluated-data';
import { Sound } from './sound';
import { load } from 'hibernatets';
import type { NullSafe } from '../util/types';

export class ReceiverData {

    constructor(public data: ConnectionResponse) {

    }


    async evaluate(): Promise<EvaluatedData> {
        const dataCopy: ConnectionResponse = JSON.parse(JSON.stringify(this.data))

        if (dataCopy.notification?.sound) {
            dataCopy.notification.sound = await this.evaluateSound(dataCopy.notification?.sound)
        }

        return new EvaluatedData(dataCopy as SenderResponse<string>, this.data)
    }

    async evaluateSound(sound: NullSafe<SenderResponse["notification"]>["sound"]) {
        if (sound instanceof Array) {
            return sound[Math.floor(Math.random() * sound.length)]
        }
        if (sound === "*") {
            const sounds = await load(Sound, "TRUE=TRUE")
            const soundKeys = sounds.map(sound => sound.key)
            return soundKeys[Math.floor(Math.random() * soundKeys.length)]
        }
        return sound;
    }

}