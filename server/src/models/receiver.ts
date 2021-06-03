import type { ReceiverData } from './receiver-data';
import type { EvaluatedData } from './evaluated-data';
import { firebasemessageing, FireBaseMessagingPayload } from '../services/firebasemessaging';
import ws from '../services/websocketmessaging';
import { logKibana } from '../util/log';
import { autosaveable, settable } from 'express-hibernate-wrapper';
import { column, primary, table } from 'hibernatets';

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

    async send(data: ReceiverData | false): Promise<number> {
        if (!data) {
            return;
        }
        const evaluatedData = await data.evaluate();

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
    sendForIp(evaluatedData: EvaluatedData): number {
        fetch(`http://${this.ip}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(evaluatedData.data)
        })
        return 0;
    }

    private sendForWebsocket(evaluatedDataObj: EvaluatedData): number {
        const evaluatedData = evaluatedDataObj.data
        console.log(`notification to ${this.ip} for ${evaluatedData.notification.title}`)
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
            }).catch(e => {
                logKibana("ERROR", "failed connecting to websocket", e)
            })
        return 0;
    }

    private async sendForFirebase(evaluatedDataObj: EvaluatedData): Promise<number> {
        const evaluatedData = evaluatedDataObj.data
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
}