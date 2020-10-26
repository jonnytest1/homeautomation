
import { client as WebSocketClient } from 'websocket';
import registration from './registration';

export class MessageHandling {

    private readonly deviceKey = 'pc-receiver';
    client: any;

    counter = 0;

    connection;
    constructor() {
        this.register();
    }

    private register() {
        this.client = new WebSocketClient({
            tlsOptions: {
                rejectUnauthorized: false
            }
        });
        this.client.on('connect', this.onConnection.bind(this));
        this.client.on('connectFailed', this.connectionFailed.bind(this));
        this.client.connect('wss://192.168.178.54/nodets/rest/ws?client=' + registration.deviceKey, 'echo-protocol', undefined, undefined, {
            body: 'test'
        });
    }

    connectionFailed(error) {
        console.error(error);
        this.counter++;
        setTimeout(() => {
            this.register();
        }, this.counter * 1000);

    }

    onConnection(connection) {
        this.connection = connection;
        this.counter = 0;
        console.log('WebSocket Client Connected');

        connection.on('error', function (error) {
            console.log('Connection Error: ' + error.toString());
        });
        connection.on('close', (...args) => {
            console.log('echo-protocol Connection Closed');
            setTimeout(this.register.bind(this), 500);
        });
        connection.on('message', (message) => {
            this.counter = 0;
            if (message.type === 'utf8') {
                let data = message.utf8Data;
                console.log(`Received: '${data}'`);
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error(e);
                }

            }
        });
    }

}