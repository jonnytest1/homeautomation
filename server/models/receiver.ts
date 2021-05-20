import { NotificationData, SenderResponse, SoundType } from './connection-response';
import { Sound } from './sound';
import { autosaveable } from '../express-db-wrapper';
import { firebasemessageing, FireBaseMessagingPayload } from '../services/firebasemessaging';
import ws from '../services/websocketmessaging';
import { logKibana } from '../util/log';
import { settable } from '../util/settable';
import { column, load, primary, table } from 'hibernatets';

const fetch = require('node-fetch');
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
    ip: string;

    @settable
    @column()
    type: 'ip' | 'firebase' | 'ws';

    constructor() {
        //
    }

    async send(data: SenderResponse | false): Promise<number> {
        if (!data) {
            return;
        }
        const evaluatedData = await this.evaluateData(data);

        switch (this.type) {
            case "ws":
                return this.sendForWebsocket(evaluatedData);
            case "firebase":
                return await this.sendForFirebase(evaluatedData);
            case "ip":
                return await this.sendForIp(evaluatedData);
            default:
                return 0;
        }




    }
    sendForIp(evaluatedData: SenderResponse<string>): number {
        fetch(`http://${this.ip}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(evaluatedData)
        })
        return 0;
    }

    private sendForWebsocket(evaluatedData: SenderResponse<string>): number {
        ws.sendWebsocket(this.ip, evaluatedData)
            .then(response => {
                if (response === "dismissed") {
                    if (evaluatedData.attributes && evaluatedData.attributes.messageId) {
                        firebasemessageing.sendNotification(this.firebaseToken, {
                            type: "removeNotification",
                            id: evaluatedData.attributes.messageId
                        });
                    }
                }
            });
        return 0;
    }

    private async sendForFirebase(evaluatedData: SenderResponse<string>): Promise<number> {
        const firebaseData = evaluatedData as FireBaseMessagingPayload

        console.log(`sending push notification for ${this.name}`);
        const response = await firebasemessageing.sendNotification(this.firebaseToken, firebaseData);
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
                });
            }
            if (response.results[0].messageId) {
                evaluatedData.attributes = { ...evaluatedData.attributes, messageId: response.results[0].messageId };
            }
        }
        return response.failureCount;
    }

    async evaluateData(data: SenderResponse): Promise<SenderResponse<string>> {
        const evaluatedData = {
            ...data,
        }
        if (evaluatedData.notification) {
            evaluatedData.notification = await this.getNotificationData(evaluatedData.notification)
        }

        return evaluatedData as SenderResponse<string>;
    }

    async getNotificationData(notificationData?: NotificationData): Promise<NotificationData<string>> {
        const notificationObj = {
            ...notificationData
        }
        if (notificationObj.sound) {
            notificationObj.sound = await this.evaluateSounds(notificationData.sound)
        }
        return notificationObj as NotificationData<string>
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