import type { SenderResponse } from '../models/connection-response';
import { Websocket, WS } from 'express-hibernate-wrapper';
import { client as WebSocketClient } from 'websocket';


@WS({
    path: 'ws'
})
class WebsocketMessaging {

    private static connections = {};

    websocket: Websocket;

    client: WebSocketClient;
    constructor() {
        //
    }

    sendWebsocket(ip, data: SenderResponse): Promise<string> {
        return new Promise((resolver, err) => {
            console.log('sending websocket connection');
            this.client = new WebSocketClient();
            this.client.on('connect', (connection) => {
                connection.on('error', function (error) {
                    console.log('Connection Error: ' + error.toString());
                    err(error);
                });
                connection.on('close', () => {
                    console.log('Connection Closed');
                    resolver(null)

                });
                connection.on('message', (data) => {
                    console.log(`received response '${data.utf8Data}'`);
                    resolver(data.utf8Data)
                });
            });
            this.client.on('connectFailed', () => {
                console.log(`connection to ws://${ip} failed`);
                err(`connection to ws://${ip} failed`);
            });
            const connectionUrl = new URL(`ws://${ip}`);
            connectionUrl.searchParams.append('data', JSON.stringify(data));
            this.client.connect(connectionUrl.href, 'echo-protocol');
        });
    }

    send(deviceKey: string, data: SenderResponse) {
        const websocket = WebsocketMessaging.connections[deviceKey];
        if (!websocket) {
            console.log(`no webscoket for ${deviceKey}`);
        } else {
            try {
                websocket.send(JSON.stringify(data));
            } catch (e) {
                console.error(e);
            }
        }
    }

    static onConnected(key: string, ws) {
        this.connections[key] = ws;
        console.log(`added connection for ${key}`);
    }

}

export default new WebsocketMessaging();