import { Timer } from '../models/timer';
import { Sender } from '../models/sender';
import { senderLoader } from '../services/sender-loader';
import { HttpRequest, Websocket, WS } from 'express-hibernate-wrapper';
import { load } from 'hibernatets';

export interface SocketResponses {
    timerUpdate: Array<Timer>

    senderUpdate: Array<Sender>
}


@WS({ path: "/updates" })
export class FrontendWebsocket {

    static websockets: Array<Websocket> = []


    static async updateTimers() {
        const timers = await load(Timer, `alerted='false' AND timerClassName='Sender'`)
        this.websockets.forEach(async (socket) => {
            this.sendToWebsocket(socket, {
                type: "timerUpdate",
                data: timers
            })
        })
    }

    static async updateSenders() {
        const senders = await senderLoader.loadSenders()
        this.websockets.forEach(async (socket) => {
            this.sendToWebsocket(socket, {
                type: "senderUpdate",
                data: senders
            })
        })
    }

    static async updateTimersForSocket(socket) {
        const timers = await load(Timer, `alerted='false' AND timerClassName='Sender'`)
        this.sendToWebsocket(socket, {
            type: "timerUpdate",
            data: timers
        })
    }

    static sendToWebsocket<T extends keyof SocketResponses>(ws: Websocket, data: { type: T, data: SocketResponses[T] }) {
        ws.send(JSON.stringify(data))
    }

    static onConnected(req: HttpRequest, websocket: Websocket) {
        this.websockets.push(websocket)
        websocket.on('close', () => {
            this.websockets = this.websockets.filter(ws => ws !== websocket)
        });
        websocket.on('error', e => {
            console.error(e);
        });
        websocket.on("message", async (message) => {
            if (message == "getTimers") {
                this.updateTimersForSocket(websocket)
            }
            // TODO
        })
        this.updateTimersForSocket(websocket)
    }
}