import type { SocketResponses } from './websocket-response';
import { Timer } from '../models/timer';
import { senderLoader } from '../services/sender-loader';
import { Item } from '../models/inventory/item';
import { Receiver } from '../models/receiver';
import { getNodeDefintions, nodes, setNodes, typeImplementations } from '../services/generic-node/generic-node-service';
import { lastEventTimesObs } from '../services/generic-node/last-event-service';
import type { NodeData } from '../services/generic-node/typing/generic-node-type';
import { HttpRequest, Websocket, WS } from 'express-hibernate-wrapper';
import { load, SqlCondition } from 'hibernatets';


type ExtendedSocket = Websocket & {
  isUpdatingNodes?: boolean,
  nodeCache: NodeData
}

@WS({ path: "/updates" })
export class FrontendWebsocket {

  static websockets: Array<ExtendedSocket> = []
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

  static onConnected(req: HttpRequest, websocket: ExtendedSocket) {
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
        const evt = JSON.parse(message)
        if (evt.type == "store-nodes") {
          websocket.isUpdatingNodes = true
          await setNodes(evt.data, evt.changedUuid)
          websocket.isUpdatingNodes = false
        } else if (evt.type == "ping") {
          websocket.send(JSON.stringify({ type: "pong" }))
        }
      }
      // TODO
    })
    this.updateTimersForSocket(websocket)
    this.updateInventory(websocket)

    this.sendToWebsocket(websocket, {
      type: "nodeDefinitions",
      data: getNodeDefintions()
    })
    this.sendToWebsocket(websocket, {
      type: "nodeData",
      data: nodes.value
    })
    websocket.nodeCache = JSON.parse(JSON.stringify(nodes.value))
    this.sendToWebsocket(websocket, {
      type: "lastEventTimes",
      data: lastEventTimesObs.value
    })
    load(Receiver, SqlCondition.ALL, [], {
      deep: ["actions", "events"]
    }).then(receviers => {
      receviers.forEach(rec => {
        this.updateState(rec, websocket)
      })

    })

  }
}

nodes.subscribe(nodeUpdates => {
  FrontendWebsocket.websockets.forEach(async (socket) => {
    if (socket.isUpdatingNodes) {
      return
    }
    const cacheData = socket.nodeCache

    if (JSON.stringify({
      c: cacheData.connections,
      g: cacheData.globals
    }) == JSON.stringify({
      c: cacheData.connections,
      g: cacheData.globals
    })) {
      if (nodeUpdates.nodes.length < cacheData.nodes.length) {
        FrontendWebsocket.sendToWebsocket(socket, {
          type: "nodeData",
          data: nodeUpdates
        })
        return
      }
      for (const node of nodeUpdates.nodes) {
        if (JSON.stringify(node) != JSON.stringify(cacheData.nodes.find(n => n.uuid === node.uuid))) {
          FrontendWebsocket.sendToWebsocket(socket, {
            type: "nodeUpdate",
            data: node
          })
        }
      }
    } else {
      FrontendWebsocket.sendToWebsocket(socket, {
        type: "nodeData",
        data: nodeUpdates
      })
    }


    socket.nodeCache = JSON.parse(JSON.stringify(nodeUpdates))
  })
})


lastEventTimesObs.subscribe(times => {
  FrontendWebsocket.websockets.forEach(async (socket) => {
    if (socket.isUpdatingNodes) {
      return
    }
    FrontendWebsocket.sendToWebsocket(socket, {
      type: "lastEventTimes",
      data: times
    })
  })
})


typeImplementations.subscribe(typeImpl => {
  FrontendWebsocket.websockets.forEach(async (socket) => {
    FrontendWebsocket.sendToWebsocket(socket, {
      type: "nodeDefinitions",
      data: getNodeDefintions()
    })
  })
})
