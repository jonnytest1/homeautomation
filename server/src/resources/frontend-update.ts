import type { SocketResponses } from './websocket-response';
import { Timer } from '../models/timer';
import { senderLoader } from '../services/sender-loader';
import { HttpRequest, Websocket, WS } from 'express-hibernate-wrapper';
import { load } from 'hibernatets';


@WS({ path: "/updates" })
export class FrontendWebsocket {

    static websockets: Array<Websocket> = []
    static async updateTimers() {
        const timers = await load(Timer, Timer.timerQuery)
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
        const timers = await load(Timer, Timer.timerQuery)
        this.sendToWebsocket(socket, {
            type: "timerUpdate",
            data: timers
        })
    }

    static sendToWebsocket<T extends keyof SocketResponses>(ws: Websocket, data: { type: T, data: SocketResponses[T] }) {
        if (ws.readyState !== ws.OPEN) {
            setTimeout(() => {
                this.sendToWebsocket(ws, data)
            }, 200)
            return
        }
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