import { environment } from '../../environment';
import { ReconnectingSocket } from '../../util/reconnecting-websocket';

const https = require('https');

interface Key {
  board: string,
  key: string
  keydown: () => void
  keyup?: () => void
}


export class ReconnectingKeySocket {

  socketRef = new ReconnectingSocket()

  keys: { [board: string]: { [key: string]: Array<Key> } } = {}
  constructor() {

  }


  addKey(key: Key) {
    this.keys[key.board] ??= {}
    this.keys[key.board][key.key] ??= []
    this.keys[key.board][key.key].push(key)
  }


  connect() {
    this.socketRef.onmessage(m => {
      if (m.type == "utf8") {
        const evt = JSON.parse(m.utf8Data) as {
          type: "keychange",
          board: string,
          key: string,
          enabled: boolean
        }
        if (evt.type == "keychange") {
          this.keys[evt.board]?.[evt.key]?.forEach(key => {
            if (evt.enabled) {
              key.keydown()
            } else {
              key.keyup?.();
            }
          })
        }

      }
    })
    const keys: Array<string> = []
    for (const board in this.keys) {
      for (const key in this.keys[board]) {
        keys.push(`${board}-${key}`)
      }
    }

    this.socketRef.connect(environment.KEY_URL, undefined, undefined, {
      keys: keys.join(";")
    }, {
      agent: new https.Agent({
        rejectUnauthorized: false
      })
    })
    setInterval(() => {
      this.socketRef.send(JSON.stringify({
        type: "ping"
      }))
    }, 20000)
  }
}