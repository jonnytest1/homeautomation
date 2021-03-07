import { column, load, primary, table } from 'hibernatets';

import { autosaveable } from '../express-db-wrapper';
import { firebasemessageing } from '../services/firebasemessaging';
import ws from '../services/websocketmessaging';
import { logKibana } from '../util/log';
import { settable } from '../util/settable';
import { SenderResponse, SoundType } from './connection-response';
import { Sound } from './sound';

@table()
@autosaveable
export class Receiver {

    @column()
    @settable
    deviceKey: string;

    @settable
    @column()
    firebaseToken: string;

    @primary()
    id;

    @settable
    @column()
    description: string;

    @settable
    @column()
    name: string;

    @settable
    @column()
    ip: String;

    @settable
    @column()
    type: 'ip' | 'firebase' | 'ws';

    constructor() {

    }

    async send(data: SenderResponse): Promise<number> {
        const evaluatedData = await this.evaluateData(data);
        if (this.type == 'ws') {
            ws.sendWebsocket(this.ip, evaluatedData)
                .then(response => {
                    if (response === "dismissed") {
                        if (evaluatedData.attributes && evaluatedData.attributes.messageId) {
                            firebasemessageing.sendNotification(this.firebaseToken, {
                                type: "removeNotification",
                                id: evaluatedData.attributes.messageId
                            })
                        }
                    }
                })
            return 0;
        }

        if (!this.firebaseToken) {
            console.log(`sending websocket notification for ${this.name}`);
            ws.send(this.deviceKey, evaluatedData);
            return 0;
        }
        if (process.env.DEBUG) {
            return 0;
        }
        console.log(`sending push notification for ${this.name}`);
        const response = await firebasemessageing.sendNotification(this.firebaseToken, evaluatedData);
        if (response.failureCount > 0) {
            logKibana('ERROR', {
                message: 'error sending firebase to receiver',
                reason: JSON.stringify(response.results)
            });
        }

        if (response.results[0]) {
            if (response.results[0].canonicalRegistrationToken) {
                logKibana("ERROR", {
                    message: "this time there was a token in the response",
                    token: response.results[0].canonicalRegistrationToken
                })
            }
            if (response.results[0].messageId) {
                evaluatedData.attributes = { ...evaluatedData.attributes, messageId: response.results[0].messageId }
            }
        }
        return response.failureCount;
    }

    async evaluateData(data: SenderResponse) {
        const evaluatedData = {
            ...data,
            notification: data.notification ? {
                ...data.notification,
                sound: await this.evaluateSounds(data.notification.sound)
            } : undefined
        }

        return evaluatedData;
    }

    async evaluateSounds(sound: SoundType): Promise<string> {
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