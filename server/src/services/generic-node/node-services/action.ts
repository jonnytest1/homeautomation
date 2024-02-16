import { addTypeImpl } from '../generic-node-service'
import type { ElementNode } from '../typing/generic-node-type'
import { Receiver } from '../../../models/receiver'
import { logKibana } from '../../../util/log'
import { ReceiverEvent } from '../../../models/receiver-event'
import { SqlCondition, load } from 'hibernatets'



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
      deep: {
        actions: {
          filter: new SqlCondition("name").equals(actionName),
          depths: 1
        }
      }
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
          node.runtimeContext.info = "timedout"
          callbacks.updateNode()
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
        of: "select"
      },
      action: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  async nodeChanged(node, prev) {

    node.runtimeContext.parameters ??= {}
    const receiver = await load(Receiver, SqlCondition.ALL, [], {
      deep: ["actions"]
    })

    const receiversWithAction = receiver.filter(rec => !!rec.actions.length)
    node.runtimeContext.parameters.receiver = {
      type: "select",
      options: receiversWithAction.map(rec => rec.deviceKey)
    }
    node.parameters ??= {}
    node.parameters.receiver ??= node.runtimeContext.parameters?.receiver?.options[0]

    if (node.parameters?.receiver) {
      const rec = receiversWithAction.find(rec => rec.deviceKey === node.parameters?.receiver)

      if (rec) {
        node.runtimeContext.parameters.action = {
          type: "select",
          options: rec.actions.map(a => `${a.name}`),
          optionDisplayNames: rec.actions.map(a => `${a.name} (${a.confirm == "1" ? "confirmed" : "direct"})`),
        }
        if (prev?.parameters?.receiver && prev?.parameters?.receiver != node.parameters?.receiver) {
          delete node.parameters.action
        }

        node.parameters.action ??= node.runtimeContext.parameters.action.options[0]
      }
    }

  }
})
