import { addTypeImpl } from '../generic-node-service'
import type { ElementNode } from '../typing/element-node'
import { Receiver } from '../../../models/receiver'
import { logKibana } from '../../../util/log'
import { ReceiverEvent } from '../../../models/receiver-event'
import { genericNodeDataStore } from '../generic-store/reference'
import { backendToFrontendStoreActions } from '../generic-store/actions'
import { updateRuntimeParameter } from '../element-node-fnc'
import { MariaDbBase, SqlCondition, load } from 'hibernatets'

const pool = new MariaDbBase(undefined, {
  connectionLimit: 6,
  // trace: true, 
  logPackets: true,
  keepAliveDelay: 5000,
  idleTimeout: 560,
  maxAllowedPacket: 67108864

})

const pendingActonMap: { [uuid: string]: number } = {}

addTypeImpl({
  async process(node: ElementNode<{ receiver?: string, action?: string }>, evt, callbacks) {

    if (!node.parameters?.receiver || !node.parameters.action) {
      return
    }
    let actionEndpoint = "action"
    if (pendingActonMap[node.uuid] && Date.now() < (pendingActonMap[node.uuid] + (10 * 1000))) {
      actionEndpoint = "action/confirm"
    }




    const actionName = node.parameters.action
    const receiver = await load(Receiver, new SqlCondition("deviceKey").equals(node.parameters?.receiver), [], {
      first: true,
      interceptArrayFunctions: true,
      deep: {
        actions: {
          filter: new SqlCondition("name").equals(actionName),
          depths: 1
        }
      },
      db: pool
    })

    if (!receiver) {
      logKibana("ERROR", "didnt find receiver")
      return
    }

    const action = (receiver.actions ?? []).find(action => action.name == actionName);
    if (!action) {
      logKibana("ERROR", "didnt find action")
      return
    }

    receiver.events.push(new ReceiverEvent({
      name: actionName
    }))



    const url = new URL(actionEndpoint, `http://${receiver.ip}`).href;
    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          type: "trigger-action",
          name: action.name
        })
      })
      const responseTxt = await response.text();
      if (responseTxt == "pending_confirmation") {
        pendingActonMap[node.uuid] = Date.now()
        node.runtimeContext.info = "pending"
        callbacks.updateNode()
        setTimeout(() => {
          if (node.runtimeContext.info == "pending") {
            node.runtimeContext.info = "timedout"
            callbacks.updateNode()
          }
        }, 10000)
        return
      } else {
        delete node.runtimeContext.info
        callbacks.updateNode()
      }
    } catch (e) {
      logKibana("ERROR", {
        message: "error for action request",
        actionType: actionEndpoint,
        url: url,
        action: node.parameters?.action ?? '',
        name: node.parameters?.name ?? '',
        receiver: node.parameters?.receiver ?? '',
        node: node.uuid
      }, e)
    }
    callbacks.continue(evt)
  },
  nodeDefinition: () => ({
    inputs: 1,
    type: "action",
    options: {
      receiver: {
        type: "placeholder",
        of: "select",
        invalidates: ["action"]
      },
      action: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  async nodeChanged(node, prev) {

    const receiver = await load(Receiver, SqlCondition.ALL, [], {
      deep: ["actions"]
    })

    const receiversWithAction = receiver.filter(rec => !!rec.actions.length)


    updateRuntimeParameter(node, "receiver", {
      type: "select",
      options: receiversWithAction.map(rec => rec.deviceKey)
    })
    const rec = receiversWithAction.find(rec => rec.deviceKey === node.parameters.receiver)

    if (rec) {

      updateRuntimeParameter(node, "action", {
        type: "select",
        options: rec.actions.map(a => `${a.name}`),
        optionDisplayNames: rec.actions.map(a => `${a.name} (${a.confirm == "1" ? "confirmed" : "direct"})`),
      })

      genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateRuntimeInfo({
        nodeUuid: node.uuid,
        info: `${node.parameters.receiver} - ${node.parameters.action}`
      }))

    }

  }
})
