import { addTypeImpl } from '../../generic-node-service';
import { genericNodeDataStore } from '../../generic-store/reference';
import { backendToFrontendStoreActions } from '../../generic-store/actions';
import { generateDtsFromSchema, mainTypeName } from '../../json-schema-type-util';
import { updateRuntimeParameter } from '../../element-node-fnc';
import { createNodeEvent } from '../../generic-store/node-event-factory';
import { logKibana } from '../../../../util/log';
import type { ExtendedJsonSchema } from 'json-schema-merger';
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
      console.log("emitting trigger from " + node.uuid)
      setImmediate(() => {
        try {
          node.continue(createNodeEvent({
            context: {
              triggernode: node.uuid,
            },
            payload: {}
          })).then((trace) => {
            if (trace.logIt) {
              logKibana("ERROR", {
                message: "logged call trace",
                trace
              })
            }

          })
        } catch (e) {
          debugger;
        }
      })

    }

    const fileContent = await readFile(join(__dirname, "trigger.html"), { encoding: "utf8" })

    updateRuntimeParameter(node, 'trigger', {
      document: fileContent,
      type: "iframe"
    })


    const ouptutSchema: ExtendedJsonSchema = {
      type: "object"
    };
    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputSchema({
      nodeUuid: node.uuid,
      schema: {
        jsonSchema: ouptutSchema,
        dts: await generateDtsFromSchema(ouptutSchema, `${node.type}-${node.uuid}-node trigger output`),
        mainTypeName: mainTypeName
      }
    }))

  }
})