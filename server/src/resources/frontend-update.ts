import type { GenericNodeEvents, SocketResponses } from './websocket-response';
import type { FrontendToBackendEvents } from './socket-events';
import { Timer } from '../models/timer';
import { senderLoader } from '../services/sender-loader';
import { Item } from '../models/inventory/item';
import { Receiver } from '../models/receiver';
import { genericNodeEvents } from '../services/generic-node/socket/generic-node-socket';
import type { StoreEvents } from '../services/generic-node/typing/frontend-events';
import { HttpRequest, Websocket, WS } from 'express-hibernate-wrapper';
import { load, SqlCondition } from 'hibernatets';


type ExtendedSocket = Websocket & {
  instanceId?: string
  deviceData: unknown
}


@WS({ path: "/updates" })
export class FrontendWebsocket {

  static websockets: Array<ExtendedSocket> = []

  static connectionInstanceProperties: Record<string, {}> = {}
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

  static reloadAll() {
    this.forSockets(s => {
      this.sendToWebsocket(s, { type: "reload", data: undefined })
    })
  }

  static forSockets<T extends object>(callback: (socket: Websocket, props: T) => (void | Promise<void>)) {
    this.websockets.forEach(socket => {
      let props = {}
      if (socket.instanceId) {
        props = FrontendWebsocket.connectionInstanceProperties[socket.instanceId]
      }
      callback(socket, props as T)
    })
  }


  static onConnected(req: HttpRequest, websocket: ExtendedSocket) {
    const socketInstance = req.query.instance as string
    const props = this.connectionInstanceProperties[socketInstance] ??= {}
    if (props) {
      Object.assign(websocket, props)
    }
    websocket.instanceId = socketInstance
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
      } else {
        const evt = JSON.parse(message) as FrontendToBackendEvents
        if (evt.type == "ping") {
          websocket.send(JSON.stringify({ type: "pong" }))
        } else if (evt.type === "generic-node-event") {
          genericNodeEvents.next({
            evt: evt.data,
            socket: websocket,
            socketInstanceProperties: props,
            reply: (resp: GenericNodeEvents) => {
              this.sendToWebsocket(websocket, {
                type: "genericNode",
                data: resp
              })
            },
            pass(resp: StoreEvents) {
              FrontendWebsocket.websockets.forEach(async (socket) => {
                if (socket !== websocket) {
                  FrontendWebsocket.sendToWebsocket(socket, {
                    type: "genericNode",
                    data: {
                      type: "store-reducer",
                      data: resp
                    }
                  })
                }
              })
            }
          })
        } else if (evt.type === "device-data") {
          websocket.deviceData = evt.data
        }
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



export const withSideEffects = true