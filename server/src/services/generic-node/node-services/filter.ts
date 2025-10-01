

import { nodeContext } from './code-utils/node-parameters';
import { addTypeImpl } from '../generic-node-service';
import type { ElementNode } from '../typing/element-node';
import type { NodeDefOptinos, NodeDefToType } from '../typing/node-options';
import { mainTypeName } from '../json-schema-type-util';
import { genericNodeDataStore } from '../generic-store/reference';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { lastEventTimesForNode } from '../last-event-service';
import { updateRuntimeParameter, updateServerContext } from '../element-node-fnc';
import { HOUR } from '../../../constant';
import type { NodeEvent } from '../node-event';
import type { EvalNode } from '../typing/generic-node-type';
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
DateMock.now = () => Date.now()

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
  server_context_type(s: {
    inputs: { [index: number]: InputContext },
    inputhistory?: Array<{ timestamp: number, evt: unknown, index: number }>
    outputhistory?: Array<{ timestamp: number, evt: unknown, index: number }>
  }) {
    return s
  },
  process(node, data, callbacks) {

    const inputHistory = node.serverContext?.inputhistory ?? []
    const historyKey = `inputhistory${data.inputIndex > 0 ? data.inputIndex : ""}`
    if (node.parameters?.[historyKey]?.length) {
      const inputhistoryNum = +node.parameters?.[historyKey]
      if (!isNaN(inputhistoryNum) && inputhistoryNum > 0) {
        const inputHistoryDays = inputhistoryNum * HOUR * 24

        inputHistory.push({
          timestamp: Date.now(),
          evt: data.payload,
          index: data.inputIndex,
        })
        const cutoff = Date.now() - inputHistoryDays
        while (inputHistory[0]?.timestamp < cutoff) {
          inputHistory.shift()
        }
        updateServerContext(node, {
          inputhistory: inputHistory
        })
      }
    }

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

    let returnValue: boolean | number | { 0: boolean, 1: unknown } = false
    try {



      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (inputHistory[0]) {
          const input0ts = inputHistory[0]?.timestamp
          const input0key = `inputhistory${inputHistory[0].index > 0 ? inputHistory[0].index : ""}`;
          const inputhistoryNum = +node.parameters?.[input0key]
          if (!isNaN(inputhistoryNum) && inputhistoryNum > 0) {
            const inputHistoryDays = inputhistoryNum * HOUR * 24
            const cutoff = Date.now() - inputHistoryDays

            if (input0ts < cutoff) {
              inputHistory.shift()
            } else {
              break;
            }

          } else {
            inputHistory.shift()
          }
        } else {
          break
        }

      }
      const contextObject = {
        payload: data.payload,
        inputs: inputs,
        Date: DateMock,
        lastOutputTs,
        inputhistory: inputHistory,
        outputhistory: node.serverContext?.outputhistory ?? [],
        setInfo: (text: string) => {
          if (text != node.runtimeContext.info) {
            genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateRuntimeInfo({
              info: text,
              nodeUuid: node.uuid
            }))
          }
        },
        emit(index: number, event) {
          if (index > 0) {
            const copy = data.clone()
            copy.updatePayload(event)
            addOutputHistoryEvent(node, copy, index);
            callbacks.continue(copy, index)
          }
        },
        nodeContext: () => nodeContext(node)
      };
      /*  logKibana("DEBUG", {
         message: "filter context",
         ...contextObject,
         nodeid: node.uuid
       }) */
      returnValue = nodeScript.script.runInNewContext(contextObject)
    } catch (e) {
      debugger
    }

    if (typeof returnValue == "object") {
      for (let i = 1; i < +(node.parameters?.additional_output ?? 0) + 1; i++) {
        if (returnValue[i]) {
          const copy = data.clone()
          copy.updatePayload(returnValue[i])
          addOutputHistoryEvent(node, copy, i);
          callbacks.continue(copy, i)
        }
      }

      returnValue = returnValue[0]
    }


    if (returnValue != false) {
      let emitIndex = 0

      if (typeof returnValue == "number") {
        emitIndex = returnValue
      }

      addOutputHistoryEvent(node, data, emitIndex);
      callbacks.continue(data, emitIndex)
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
      additional_output: {
        type: "number",
        min: 0
      },
      outputhistory: {
        type: "number",
        title: "output history days",
      },
      inputhistory: {
        type: "number",
        title: "input history days",
      },
      code: {
        type: "monaco",
        default: `function filter(input:InputType):FilterType{\n\n}`,
        order: -1
      }
    }
  }),
  nodeChanged(node, prev) {

    if (node.parameters) {
      if (node.parameters.additional !== undefined) {
        if (node.runtimeContext.inputs != +node.parameters.additional + 1) {
          genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateInputs({
            nodeUuid: node.uuid,
            inputs: +node.parameters.additional + 1
          }))
          for (let i = 1; i < Infinity; i++) {
            if (i < +node.parameters.additional + 1) {
              updateRuntimeParameter(node, `inputhistory${i}` as "inputhistory", {
                type: "number",
                title: `input history days index:${i}`,
                order: 1
              })
            } else if (node.runtimeContext.parameters?.[`inputhistory${i}`]) {
              updateRuntimeParameter(node, `inputhistory${i}` as "inputhistory", undefined as any)
            } else {
              break;
            }

          }
        }
      }

      if (node.parameters.additional_output !== undefined) {
        if (node.runtimeContext.outputs != +node.parameters.additional_output + 1) {
          genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputs({
            nodeUuid: node.uuid,
            outputs: +node.parameters.additional_output + 1
          }))

          for (let i = 1; i < Infinity; i++) {
            if (i < +node.parameters.additional_output + 1) {
              updateRuntimeParameter(node, `outputhistory${i}` as "outputhistory", {
                type: "number",
                title: `output history days index:${i}`,
                order: 1
              })
            } else if (node.runtimeContext.parameters?.[`outputhistory${i}`]) {
              updateRuntimeParameter(node, `outputhistory${i}` as "outputhistory", undefined as any)
            } else {
              break;
            }
          }
        }
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

      type FilterType=boolean ${node.parameters?.additional_output ? `|number |${outputsObjectGlobals(+node.parameters?.additional_output)}` : ''} ;

      ${node.parameters?.additional ? inputsGlobals(+node.parameters.additional) : ''}
      var lastOutputTs:number|undefined,
      var  inputhistory: Array<{timestamp:number,evt:unknown,index:number}>,
      var  outputhistory: Array<{timestamp:number,evt:unknown,index:number}>
      var setInfo:(text:string)=>void
      var emit(index:${node.parameters?.additional_output ? emitTypes(+node.parameters?.additional_output) : 'never'},data:any)=>void
      var context; 
      var nodeContext:<T>()=> T & {
         set:<K extends keyof T>(key:K,value:T[K]) => void
      }
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
function addOutputHistoryEvent(node: EvalNode<{ additional: { type: "number"; min: number; }; additional_output: { type: "number"; min: number; }; outputhistory: { type: "number"; title: string; }; inputhistory: { type: "number"; title: string; }; code: { type: "monaco"; default: string; order: number; }; }, { inputs: { [index: number]: InputContext; }; inputhistory?: Array<{ timestamp: number; evt: unknown; index: number; }>; outputhistory?: Array<{ timestamp: number; evt: unknown; index: number; }>; }>, data: NodeEvent<unknown, unknown, NodeDefOptinos>, emitIndex: number) {

  const key = `outputhistory${emitIndex || ''}`


  if (node.parameters?.[key]?.length) {
    const outputHistoryNum = +node.parameters?.[key];
    if (!isNaN(outputHistoryNum) && outputHistoryNum > 0) {
      const outputHistoryDays = outputHistoryNum * HOUR * 24;

      const outputHistoryData = node.serverContext?.outputhistory ?? [];
      outputHistoryData.push({
        timestamp: Date.now(),
        evt: data.payload,
        index: emitIndex
      });
      const cutoff = Date.now() - outputHistoryDays;
      while (outputHistoryData[0]?.timestamp < cutoff) {
        outputHistoryData.shift();
      }
      updateServerContext(node, {
        outputhistory: outputHistoryData
      });
    }
  }
}

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


function emitTypes(count: number) {
  const indices = new Array(count).fill(undefined).map((_, i) => i + 1)

  return indices.join("|")
}


function outputsObjectGlobals(count: number) {

  const indices = new Array(count).fill(undefined).map((_, i) => i + 1)
  return `({0: boolean} & {
      [key in ${indices.join("|")}]:any
    })`
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
