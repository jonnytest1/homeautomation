import { environment } from '../src/environment';
import { ControlKeysWebsocket } from "../src/resources/control-keys.ws"

import { ReconnectingSocket } from '../src/util/reconnecting-socket';
import { EventEmitter } from "events"

const env = environment as typeof environment & {
  KEY_ENDPOINT: string
}

ControlKeysWebsocket.key_cache = {
  type: "keys",
  data: {
    firstboard: [],
    bluetoothboard: []
  }
}








const oscket = new ReconnectingSocket({ tlsOptions: { agent: false, rejectUnauthorized: false } })
oscket.on("connect", c => {



  const socketPRoxy = new EventEmitter() as EventEmitter & { send?: Function }
  socketPRoxy.send = (...args) => {
    //
  }

  ControlKeysWebsocket.onConnected({ header: () => null } as any, socketPRoxy as any)

  c.on("message", e => {
    if (e.type == "utf8") {
      console.log("reemitting local setup")
      socketPRoxy.emit("message", e.utf8Data)
    }
  })
})
oscket.on("connectFailed", c => {
  debugger
})
oscket.connect(env.KEY_ENDPOINT, 'echo-protocol')