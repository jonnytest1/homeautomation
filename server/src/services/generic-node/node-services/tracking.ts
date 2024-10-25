import { TrackingEvent } from '../models/tracking-event';
import { logKibana } from '../../../util/log';
import { addTypeImpl } from '../generic-node-service';
import { mainTypeName } from '../json-schema-type-util';
import { DAYS, HOUR, MINUTE } from '../../../constant';
import { PsqlBase, save } from 'hibernatets';
import { openPools } from 'hibernatets/dbs/mariadb-base';

const trackingPool = new PsqlBase({
  keepAlive: true
})


const activeTrackingMap: Record<string, NodeJS.Timeout> = {}


const trackingEventBuffer: Array<TrackingEvent> = []


let interval: NodeJS.Timeout

let archiveInterV: NodeJS.Timeout


async function archive() {
  const start = Date.now()
  trackingPool.sqlquery(`
        INSERT INTO trackingeventarchive
          SELECT *
          from trackingevent
          where trackingevent.time_col < DATE_ADD(CURRENT_DATE(),INTERVAL -20 DAY);`.replace(/\n/g, " "))
    .then(() => {
      return trackingPool.sqlquery(`
        DELETE FROM trackingevent 
          WHERE EXISTS(
            SELECT * FROM 
            trackingeventarchive WHERE 
            trackingevent.id=trackingeventarchive.id
          );`.replace(/\n/g, " "))
    })
    .then(() => {
      logKibana("INFO", {
        message: "archived events",
        duration: Date.now() - start
      })
    })
    .catch(e => {
      logKibana("ERROR", {
        message: "error while archiving events",
        openPools: Object.values(openPools),
      }, e)
    })
}

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
    if (archiveInterV) {
      clearInterval(archiveInterV)
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
    archiveInterV = setInterval(archive, DAYS * 1)
  }
})