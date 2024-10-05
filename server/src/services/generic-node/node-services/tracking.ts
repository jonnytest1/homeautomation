import { TrackingEvent } from '../../../models/generic-node/tracking-event';
import { logKibana } from '../../../util/log';
import { addTypeImpl } from '../generic-node-service';
import { mainTypeName } from '../json-schema-type-util';
import { HOUR, MINUTE } from '../../../constant';
import { save } from 'hibernatets';
import { MariaDbBase, openPools } from 'hibernatets/dbs/mariadb-base';

const trackingPool = new MariaDbBase(undefined, {
  connectionLimit: 20,
  trace: true, logPackets: true,
  keepAliveDelay: 5000,
  idleTimeout: 560,
  maxAllowedPacket: 67108864

})


const activeTrackingMap: Record<string, NodeJS.Timeout> = {}


const trackingEventBuffer: Array<TrackingEvent> = []


let interval: NodeJS.Timeout


addTypeImpl({
  nodeDefinition() {
    return {
      type: "track",
      inputs: 1,
      options: {
        activityTimeHours: {
          type: "number",
          min: 20
        }
      }
    }
  },
  process(node, data, callbacks) {
    const evt = TrackingEvent.create(data, node)
    console.log("add tracking event for " + node.parameters?.name)
    if (activeTrackingMap[node.uuid]) {
      clearTimeout(activeTrackingMap[node.uuid])
    }

    activeTrackingMap[node.uuid] = setTimeout(() => {
      logKibana("ERROR", {
        message: "didnt receive tracking for 10 minutes",
        node: node.uuid,
        name: node.parameters?.name
      })
    }, node.parameters?.activityTimeHours ? +node.parameters?.activityTimeHours * HOUR : MINUTE * 10)

    trackingEventBuffer.push(evt)
    return
  },
  nodeChanged(node, prevNode) {
    node.runtimeContext ??= {}
    node.runtimeContext.inputSchema = {
      jsonSchema: { type: "number" },
      dts: `export type Main=number`,
      mainTypeName: mainTypeName
    }
  },
  unload(nodeas, globals) {
    trackingPool.end()
    if (interval) {
      clearInterval(interval)
    }
  },
  initializeServer() {
    interval = setInterval(() => {
      if (trackingEventBuffer.length) {
        const savingBuffer = [...trackingEventBuffer]
        trackingEventBuffer.length = 0
        save(savingBuffer, { db: trackingPool })
          .then(() => {
            console.log("saved " + savingBuffer.length + " events")
          })
          .catch(e => {
            logKibana("ERROR", {
              message: "error while saving event",
              nodes: savingBuffer,
              openPools: Object.values(openPools)
            }, e)
          })
      }
    }, 5000)

  }
})