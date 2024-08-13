import { addTypeImpl } from '../../generic-node-service';
import { updateRuntimeParameter } from '../../element-node';
import { NodeEvent } from '../../node-event';
import { join } from "path"
import { readFile } from 'fs/promises'

addTypeImpl({
  nodeDefinition: () => ({
    outputs: 1,
    type: "trigger",
    options: {
      trigger: {
        type: "placeholder",
        of: "iframe"
      }
    }
  }),
  process(node, data, callbacks) {
    //callbacks.continue(data)
  },


  async nodeChanged(node, prevNode) {
    if (node.parameters?.trigger !== prevNode?.parameters?.trigger) {
      node.continue(new NodeEvent({
        context: {
          triggernode: node.uuid,
        },
        payload: {}
      }))
    }

    const fileContent = await readFile(join(__dirname, "trigger.html"), { encoding: "utf8" })

    updateRuntimeParameter(node, 'trigger', {
      document: fileContent,
      type: "iframe"
    })

  }
})