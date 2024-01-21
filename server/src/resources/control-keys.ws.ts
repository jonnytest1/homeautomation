import { HttpRequest, WS, Websocket } from 'express-hibernate-wrapper';


type ExtendedSocket = Websocket & {}


@WS({ path: "/control-keys" })
export class ControlKeysWebsocket {

  static websockets: Array<ExtendedSocket> = []

  static key_cache: string

  static onConnected(req: HttpRequest, websocket: ExtendedSocket) {
    this.websockets.push(websocket)
    websocket.on('close', () => {
      this.websockets = this.websockets.filter(ws => ws !== websocket)
    });
    websocket.on('error', e => {
      console.error(e);
    });

    websocket.on("message", async (message) => {
      const evt = JSON.parse(message)

      if (evt.type == "keys") {
        this.key_cache = message
        this.websockets
          .filter(socket => socket !== websocket)
          .forEach(socket => {
            socket.send(message);
          })
      } else if (evt.type == "ping")
        websocket.send(JSON.stringify({ type: "pong" }))
    })
    if (this.key_cache) {
      websocket.send(this.key_cache)
    }

  }
}