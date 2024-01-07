import type { SocketResponses } from './websocket-response';
import { Timer } from '../models/timer';
import { senderLoader } from '../services/sender-loader';
import { Item } from '../models/inventory/item';
import { Receiver } from '../models/receiver';
import { HttpRequest, Websocket, WS } from 'express-hibernate-wrapper';
import { load, SqlCondition } from 'hibernatets';


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
  static async updateState(receiver: Receiver, ...sockets: Array<Websocket>) {
    let wSockets: Array<Websocket>

    if (sockets.length == 0) {
      wSockets = this.websockets;
    } else {
      wSockets = sockets;
    }
    wSockets.forEach(async (socket) => {
      this.sendToWebsocket(socket, {
        type: "receiverUpdate",
        data: receiver
      })
    })
  }
  static async updateSenders() {
    const senders = await senderLoader.loadSenders()
    this.sendWebsocket({
      type: "senderUpdate",
      data: senders
    }, ...this.websockets)
  }

  static async updateInventory(...socket: Array<Websocket>) {
    const items = await load(Item, SqlCondition.ALL, [], {
      deep: true
    })

    this.sendWebsocket({
      data: items,
      type: "inventoryUpdate"
    }, ...socket)
  }

  static async updateTimersForSocket(socket) {
    const timers = await load(Timer, Timer.timerQuery)
    this.sendToWebsocket(socket, {
      type: "timerUpdate",
      data: timers
    })
  }

  static sendWebsocket<T extends keyof SocketResponses>(data: { type: T, data: SocketResponses[T] }, ...websockets: Array<Websocket>) {
    websockets.forEach(socket => {
      this.sendToWebsocket(socket, data);
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
    this.updateInventory(websocket)

    load(Receiver, SqlCondition.ALL, [], {
      deep: ["actions", "events"]
    }).then(receviers => {
      receviers.forEach(rec => {
        this.updateState(rec, websocket)
      })

    })

  }
}