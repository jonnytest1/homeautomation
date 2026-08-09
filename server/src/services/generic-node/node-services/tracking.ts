import { TrackingEvent } from '../models/tracking-event';
import { logKibana } from '../../../util/log';
import { addTypeImpl } from '../generic-node-service';
import { mainTypeName } from '../json-schema-type-util';
import { DAYS, HOUR, MINUTE } from '../../../constant';
import { genericNodeDataStore } from '../generic-store/reference';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { PsqlBase, save } from 'hibernatets';


const trackingPool = new PsqlBase({
  keepAlive: true
})

const activeTrackingMap: Record<string, NodeJS.Timeout> = {}


const trackingEventBuffer: Array<TrackingEvent> = []


let interval: NodeJS.Timeout

let archiveInterV: NodeJS.Timeout


async function archive() {
  const start = Date.now()
  trackingPool.sqlquery({} as never, `
        INSERT INTO trackingeventarchive 
          SELECT * from trackingevent 
          where trackingevent.time_col < (NOW() - INTERVAL '20' DAY)`.replace(/\n/g, " "))
    .catch(e => {
      logKibana("ERROR", {
        message: "error while archiving events (deleting remaining)"
      }, e)
    })
    .then(() => {
      return trackingPool.sqlquery({} as never, `
        DELETE FROM trackingevent 
          WHERE EXISTS(
            SELECT * FROM 
            trackingeventarchive WHERE 
            trackingevent.id=trackingeventarchive.id
          );`.replace(/\n/g, " "))
    })
    .catch(e => {
      logKibana("ERROR", {
        message: "error while deleting  remaining events"
      }, e)
    })
    .then(() => {
      logKibana("INFO", {
        message: "archived events",
        duration: Date.now() - start
      })
    })

}

addTypeImpl({
  nodeDefinition() {
    return {
      type: "track",
      inputs: 1,
      options: {
        activityTimeHours: {
          title: "hours after which there is an alert if no tracking event happened",
          type: "number",
          min: 20
        }
      }
    }
  },
  process(node, data, callbacks) {
    const evts: Array<TrackingEvent> = []
    const payload = data.payload
    if (typeof payload == "object" && payload) {
      const payloadObj = payload as Record<string, unknown>
      for (const key in payloadObj) {
        const payloadValue = payloadObj[key]
        if (typeof payloadValue == "number") {
          evts.push(TrackingEvent.create({
            payload: payloadValue,
            context: data.context
          }, {
            uuid: node.uuid,
            parameters: {
              name: `${node.parameters?.name ?? ''}-${key.trim()}`
            }
          }))
        }
      }

    } else {
      evts.push(TrackingEvent.create(data, node))
    }

    console.log("add tracking event for " + node.parameters?.name)

    if (activeTrackingMap[node.uuid]) {
      clearTimeout(activeTrackingMap[node.uuid])
    }

    const timeout = node.parameters?.activityTimeHours ? +node.parameters?.activityTimeHours * HOUR : MINUTE * 10;
    activeTrackingMap[node.uuid] = setTimeout(() => {
      logKibana("ERROR", {
        message: `didnt receive tracking ${Math.floor(timeout / MINUTE)} minutes`,
        node: node.uuid,
        name: node.parameters?.name
      })
    }, timeout)

    trackingEventBuffer.push(...evts)
    return
  },
  nodeChanged(node, prevNode) {
    node.runtimeContext ??= {}

    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputSchema({
      nodeUuid: node.uuid,
      schema: {
        dts: `export type ${mainTypeName}=number|Record<string,number>`,
        jsonSchema: {
          anyOf: [{
            type: "number"
          },
          {
            type: "object",
            minProperties: 1,
            additionalProperties: {
              type: "number"
            }
          }]
        },
        mainTypeName: mainTypeName
      }
    }))
  },
  unload(nodeas, globals) {
    trackingPool.end()
    if (interval) {
      clearInterval(interval)
    }
    if (archiveInterV) {
      clearInterval(archiveInterV)
    }

    Object.values(activeTrackingMap)
      .forEach(clearTimeout)
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
              nodes: savingBuffer
            }, e)
          })
      }
    }, 5000)
    archiveInterV = setInterval(archive, DAYS * 1)
  }
})