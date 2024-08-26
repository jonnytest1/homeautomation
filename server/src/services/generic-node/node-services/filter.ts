

import { addTypeImpl } from '../generic-node-service';
import type { ElementNode } from '../typing/generic-node-type';
import type { NodeDefOptinos, NodeDefToType } from '../typing/node-options';
import { mainTypeName } from '../json-schema-type-util';
import { genericNodeDataStore } from '../generic-store/reference';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { updateServerContext } from '../element-node';
import { lastEventTimesForNode } from '../last-event-service';
import * as z from "zod"
import { Script } from 'vm';

const codeSchema = z.object({
  jsCode: z.string(),
  tsCode: z.string()
})

const DateMock = function (): Date {
  const dateRef = new Date();
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeStyle: "full",
    "timeZone": "Europe/Berlin",
    dateStyle: "full"
  }).formatToParts(dateRef);
  dateRef.getHours = () => +parts[8].value;
  dateRef.getDay = () => +parts[2].value;

  return dateRef;
};
const jsCache: Record<string, z.infer<typeof codeSchema> & { script: Script }> = {}



interface InputContext {
  timestamp: number;
  evt: unknown;
}


interface EvaluatedInputContext extends InputContext {
  secondsAgo: number,
  daysAgo: number
}

addTypeImpl({
  server_context_type(s: { inputs: { [index: number]: InputContext } }) {
    return s
  },
  process(node, data, callbacks) {
    if (data.inputIndex !== 0) {
      updateServerContext(node, {
        inputs: {
          ...node.serverContext?.inputs ?? {},
          [data.inputIndex]: {
            timestamp: Date.now(),
            evt: data.payload
          }
        }
      })
      return
    }

    let nodeScript = jsCache[node.uuid]
    if (!nodeScript) {
      if (node.parameters?.code) {
        nodeScript = cacheNodeScript(node)
      } else {
        return
      }
    }
    const executionTime = Date.now()


    const currentNodeServerContext = node.serverContext?.inputs ?? {}
    const inputs: Record<number, EvaluatedInputContext> = Object.fromEntries(Object.entries(currentNodeServerContext)
      .map(([key, val]) => {
        const secsAgo = Math.floor((executionTime - val.timestamp) / 1000);
        return [key, {
          ...val,
          secondsAgo: secsAgo,
          daysAgo: Math.floor(secsAgo / (60 * 60 * 24))
        }];
      }))
    const lastEmit = genericNodeDataStore.getOnce(lastEventTimesForNode(node.uuid))
    const lastOutputTs = lastEmit.output

    let returnValue
    try {
      returnValue = nodeScript.script.runInNewContext({
        payload: data.payload,
        inputs: inputs,
        Date: DateMock,
        lastOutputTs
      })
      if (typeof returnValue !== "boolean") {
        throw new Error("invalid return type")
      }

    } catch (e) {
      debugger
    }
    if (returnValue) {
      callbacks.continue(data)
    }


  },
  nodeDefinition: () => ({
    inputs: 1,
    outputs: 1,
    type: "filter",
    options: {
      additional: {
        type: "number",
        min: 0
      },
      code: {
        type: "monaco",
        default: `function filter(input:InputType):boolean{\n\n}`
      }
    }
  }),
  nodeChanged(node, prev) {

    if (node.parameters) {
      if (node.parameters.additional !== undefined) {


        node.runtimeContext.inputs = +node.parameters.additional + 1
        genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateNode({
          newNode: node
        }))
      }
    }


    const prevtsCode = jsCache[node.uuid]?.tsCode
    cacheNodeScript(node);
    if (prevtsCode === jsCache[node.uuid]?.tsCode) {
      return
    }


  },
  async connectionTypeChanged(node, connectionSchema) {

    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateEditorSchema({
      editorSchema: {
        dts: `
${connectionSchema.dts}

type InputType=${connectionSchema.mainTypeName ??= mainTypeName}
      `, globals: `
     // type InputType = EditorSchema.InputType;    


      ${node.parameters?.additional ? inputsGlobals(+node.parameters.additional) : ''}
      var lastOutputTs:number|undefined
      var context; 
      `
      },
      nodeUuid: node.uuid
    }));

    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputSchema({
      schema: {
        jsonSchema: connectionSchema.jsonSchema,
        dts: connectionSchema.dts,
        mainTypeName: connectionSchema.mainTypeName
      },
      nodeUuid: node.uuid
    }))
  }
})
function cacheNodeScript(node: ElementNode<NodeDefToType<{ code: { type: "monaco"; default: string; }; }>, NodeDefOptinos, unknown>) {
  if (node.parameters?.code) {
    try {
      const codePAram = JSON.parse(node.parameters.code ?? '{}');
      const parsedCodeAData = codeSchema.parse(codePAram)
      if (parsedCodeAData) {
        jsCache[node.uuid] = {
          script: new Script(`
        (${parsedCodeAData.jsCode})(payload)`),
          ...parsedCodeAData
        };
      }
    } catch (e) {
      debugger
    }
  }

  return jsCache[node.uuid]
}


function inputsGlobals(count: number) {

  const indices = new Array(count).fill(undefined).map((_, i) => i + 1)
  return `
    var inputs:{
      [key in ${indices.join("|")}]:{
        timestamp:number, 
        secondsAgo: number,
        daysAgo: number
        evt: unknown;
      }
    }
  `
}
