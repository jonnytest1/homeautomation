import { emitEvent } from '../services/generic-node/generic-node-service';
import { HttpRequest, WS, Websocket } from 'express-hibernate-wrapper';


type ExtendedSocket = Websocket & { listeners: Array<{ board: string, key: string, enabled?: boolean }> | undefined }


type KeyDataArray = {
  [board: string]: Array<string>;
};

type SendingKeyEvent = {
  type: "keys",
  data: KeyDataArray
}


@WS({ path: "/control-keys" })
export class ControlKeysWebsocket {

  static websockets: Array<ExtendedSocket> = []

  static key_cache: SendingKeyEvent


  static sendKeyData(websocket: ExtendedSocket, keyData: KeyDataArray) {
    if (websocket.listeners) {

      const boardobject: {
        [board: string]: {
          [key: string]: boolean
        }
      } = {}
      for (const listener of websocket.listeners) {
        boardobject[listener.board] ??= {}

        const hasKey = keyData[listener.board].includes(listener.key)
        if (listener.enabled && !hasKey) {
          websocket.send(JSON.stringify({
            type: "keychange",
            enabled: false,
            board: listener.board,
            key: listener.key
          }));
        } else if (!listener.enabled && hasKey) {
          websocket.send(JSON.stringify({
            type: "keychange",
            enabled: true,
            board: listener.board,
            key: listener.key
          }));
        }
        listener.enabled = hasKey



      }
    } else {
      websocket.send(JSON.stringify({ type: "keys", data: keyData }));
    }
  }

  static onConnected(req: HttpRequest, websocket: ExtendedSocket) {

    const subscribedKeys = req.header("keys")?.split(";")

    this.websockets.push(websocket)
    websocket.listeners = subscribedKeys?.map(keystr => {
      const [board, key] = keystr.split("-", 2)
      return ({
        board,
        key,
        enabled: false
      });
    })

    websocket.on('close', () => {
      this.websockets = this.websockets.filter(ws => ws !== websocket)
    });
    websocket.on('error', e => {
      console.error(e);
    });
    websocket.on("message", async (message) => {
      const evt = JSON.parse(message) as SendingKeyEvent
      if (evt.type == "keys") {
        this.key_cache = evt
        emitEvent("key binding", {
          payload: evt,
          context: {}
        })
        this.websockets
          .filter(socket => socket !== websocket)
          .forEach(socket => {
            this.sendKeyData(socket, evt.data)
          })


      } else if (evt.type == "ping")
        websocket.send(JSON.stringify({ type: "pong" }))
    })
    if (this.key_cache) {
      this.sendKeyData(websocket, this.key_cache.data)
    }

  }
}