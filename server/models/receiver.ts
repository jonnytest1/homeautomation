import { column, mapping, primary, table } from 'hibernatets';
import { autosaveable } from '../express-db-wrapper';
import { firebasemessageing } from '../resources/firebasemessaging';
import ws from '../resources/websocketmessaging';
import { logKibana } from '../util/log';
import { settable } from '../util/settable';
import { SenderResponse } from './connection-response';

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
        if (this.type == 'ws') {
            return ws.sendWebsocket(this.ip, data);
        }
        if (!this.firebaseToken) {
            console.log(`sending websocket notification for ${this.name}`);
            ws.send(this.deviceKey, data);
            return 0;
        }
        console.log(`sending push notification for ${this.name}`);
        const response = await firebasemessageing.sendNotification(this.firebaseToken, data);
        if (response.failureCount > 0) {
            logKibana('ERROR', {
                message: 'error sending firebase to receiver',
                reason: JSON.stringify(response.results)
            });
        }

        console.log(this.firebaseToken, response.results[0].canonicalRegistrationToken)
        // this.firebaseToken = 
        return response.failureCount;
    }
}