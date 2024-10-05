import { environment } from '../src/environment';
import { ControlKeysWebsocket } from "../src/resources/control-keys.ws"

import { ReconnectingSocket } from '../src/util/reconnecting-socket';
import { ResolvablePromise } from '../src/util/resolvable-promise';
import { emitEvent } from '../src/services/generic-node/generic-node-service';
import { MariaDbBase } from 'hibernatets/dbs/mariadb-base';
import { EventEmitter } from "events"

const hookKeys = true;
const copyDatabase = true
const eventReplay = false


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


if (hookKeys) {
  const oscket = new ReconnectingSocket({ tlsOptions: { agent: false, rejectUnauthorized: false } })
  oscket.on("connect", c => {
    const socketPRoxy = new EventEmitter() as EventEmitter & { send?: Function }
    socketPRoxy.send = (...args) => {
      //
    }
    console.log("keysocket connected")
    ControlKeysWebsocket.onConnected({ header: () => null } as any, socketPRoxy as any)

    c.on("message", e => {
      if (e.type == "utf8") {
        console.log("reemitting local setup")
        socketPRoxy.emit("message", e.utf8Data)
      }
    })
  })
  oscket.on("connectFailed", e => {
    console.error(e)
  })
  oscket.connect(env.KEY_ENDPOINT, 'echo-protocol')
  setInterval(() => {
    oscket.send(JSON.stringify({
      type: "ping"
    }))
  }, 20000)
}

if (eventReplay) {
  const db = new MariaDbBase("smarthome")
  db.selectQuery<{ type: string, data: string }>("SELECT * FROM `smarthome`.`eventhistory` ORDER BY id DESC", [])
    .then(async eventHistory => {

      for (const event of eventHistory) {
        await ResolvablePromise.delayed(5000);
        const body = JSON.parse(event.data)
        const evt = {
          payload: body,
          context: {
            deviceKey: body.deviceKey
          }
        }
        emitEvent("sender", evt)
      }


      debugger
    }).catch(e => {
      debugger
    })
}



if (copyDatabase) {
  /* const db = new DataBaseBase()
   db.selectQuery<{ TABLE_NAME: string }>("SELECT DISTINCT TABLE_NAME FROM `information_schema`.`COLUMNS` WHERE TABLE_SCHEMA='smarthome'", [], "information_schema")
     .then(async infoSchema => {
  
       for (const tableResult of infoSchema) {
         const tableName = tableResult.TABLE_NAME
  
         const data = await db.selectQuery<any>(`SELECT * FROM \`${tableName}\``)
  
  
       }
  
  
       debugger
     }).catch(e => {
       debugger
     })
  */
}
