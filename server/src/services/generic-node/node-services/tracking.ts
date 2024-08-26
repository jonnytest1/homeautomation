import { TrackingEvent } from '../../../models/generic-node/tracking-event';
import { logKibana } from '../../../util/log';
import { addTypeImpl } from '../generic-node-service';
import { mainTypeName } from '../json-schema-type-util';
import { HOUR, MINUTE } from '../../../constant';
import { openPools } from 'hibernatets/mariadb-base';
import { save } from 'hibernatets';
import { DataBaseBase } from 'hibernatets/mariadb-base';


const trackingPool = new DataBaseBase(undefined, 10)


const activeTrackingMap: Record<string, NodeJS.Timeout> = {}


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
    console.log("save tracking event")
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

    save(evt, { db: trackingPool }).catch(e => {
      logKibana("ERROR", {
        message: "error while saving event",
        node: node.uuid,
        openPools: Object.values(openPools)
      }, e)
    })
    callbacks.continue(data)
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
  },
})