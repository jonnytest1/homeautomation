

import { CompilerError, allRequired, generateDtsFromSchema, mainTypeName } from '../json-schema-type-util';
import { addTypeImpl } from '../generic-node-service';
import type { EvalNode } from '../typing/generic-node-type';
import type { Schemata } from '../typing/schemata';
import type { ElementNode } from '../typing/element-node';
import type { NodeDefToType } from '../typing/node-options';
import { tscConnectionInterfaceAndGlobals } from '../../../util/tsc-compiler';
import type { Delayed } from '../../../models/connection-response';
import { nodeTypeName } from '../element-node';
import { getTypes } from '../validation/watcher';
import { genericNodeDataStore } from '../generic-store/reference';
import { backendToFrontendStoreActions } from '../generic-store/actions';
import { updateRuntimeParameter, updateServerContext } from '../element-node-fnc';
import { Json2dts } from "json2dts"
import * as z from "zod"
import { createCompilerHost } from 'typescript';
import type { ExtendedJsonSchema } from 'json-schema-merger';
import { Script } from 'vm';

declare module "typescript" {
  export interface SourceFile {
    getNamedDeclarations(): Map<string, Array<Node>>
  }

}



const host = createCompilerHost({})



const json2dts = new Json2dts()

const codeSchema = z.object({
  jsCode: z.string(),
  tsCode: z.string(),

})

type CodeType = z.infer<typeof codeSchema>


type CodeData = CodeType & {
  timestamp: number,
  node: string
}

const jsCache: Record<string, CodeType & { script: Script, finalCode?: string }> = {}
const isMapFunctionREgex = /function\s*map\s*\(\s*input\s*:\s*InputType/


const globalTypesObjectValidation = `
type TransformationResponse = TransformationRes;
  declare function delay<T extends SenderResponse>(time: number, res: T): Delayed<T>
`


function getContext(sendData) {
  return {
    data: sendData,
    delay: (<T>(sekunden: number, objectToSend?: T): Delayed<T | void> | T => {
      const millis = sekunden * 1000;
      return {
        time: millis,
        sentData: sendData,
        nestedObject: objectToSend
      }
    }) as typeof delay
  }
}


const genericTypes = addTypeImpl({

  server_context_type: (s: { keys?: Array<string>, outputSchema?: Schemata, connectionSchema?: Schemata }) => s,
  process(node, data, callbacks) {
    let nodeScript = jsCache[node.uuid]
    if (!nodeScript) {
      if (node.parameters?.code) {
        nodeScript = cacheNodeScript(node)
      } else {
        return
      }
    }
    const returnValue = nodeScript.script.runInNewContext({
      ...getContext(data.payload),
      payload: data.payload,
      context: data.context
    })
    data.updatePayload(returnValue)
    callbacks.continue(data)

  },
  nodeDefinition: () => ({
    inputs: 1,
    outputs: 1,
    type: "map",
    options: {
      mode: {
        type: "select",
        options: ["map", "switch", "object"] as const,
        invalidates: ["code", "field"],
        order: 3
      },
      code: {
        type: "placeholder",
        of: "monaco"
      },
      field: {
        type: "placeholder",
        of: "select"
      }
    }
  }),
  nodeChanged(node, prev) {
    node.parameters ??= {}
    if (prev == undefined && !node?.parameters?.mode) {
      node.parameters.mode = "map"
    }
    if (!node.parameters?.code) {

      if (node.parameters?.mode == "map") {
        updateRuntimeParameter(node, "code", {
          type: "monaco",
          default: `function map(input:InputType){\n\n\treturn null satisfies OutputType\n}`
        })
        setNewCode(node, {
          jsCode: "function map(input){\n\n}",
          tsCode: `function map(input:InputType){\n\n}`
        })
      } else if (node.parameters?.mode == "object") {
        updateRuntimeParameter(node, "code", {
          type: "monaco"
        })
        setNewCode(node, {
          jsCode: "({\n\n})",
          tsCode: `\n({ \n\n }) satisfies ObjectType`
        })
      } else if (node.parameters?.mode == "switch") {
        updateRuntimeParameter(node, "code", {
          type: "monaco"
        })

        setNewCode(node, {
          jsCode: "({})",
          tsCode: `\n({ \n\n }) satisfies EditorSchema.SwitchMapped`
        })
      }
    }
    if (!node.runtimeContext.parameters?.code) {
      updateRuntimeParameter(node, "code", {
        type: "monaco"
      })
    }
    cacheNodeScript(node);
  },
  async connectionTypeChanged(node, connectionSchema) {
    const changed = false
    if (node.parameters?.mode == "switch") {

      const keys = Object.keys(connectionSchema.jsonSchema.properties ?? {});
      updateRuntimeParameter(node, "field", {
        type: "select",
        options: keys,
        order: 2
      })


      if (node.parameters.field) {
        const fieldSchema = connectionSchema.jsonSchema.properties![node.parameters.field]!

        const dts = await generateDtsFromSchema(fieldSchema as ExtendedJsonSchema)
        node.runtimeContext.editorSchema = {
          dts: `

        export namespace ValueTypes{
          ${dts}
        }
        export type SwitchMapped=Record<ValueTypes.${mainTypeName},any>
        `,
          globals: `type SwitchMapped= Record<EditorSchema.SwitchMapped,any>`
        }
      }

    } else if (node.parameters?.mode == "map") {



      updateEditorTypeSchema(node, connectionSchema)
    } else {

      const tscData = tscConnectionInterfaceAndGlobals()
      node.runtimeContext.editorSchema = {
        dts: `
            ${connectionSchema.dts}

            type InputType=${connectionSchema.mainTypeName ??= mainTypeName}

            ${tscData.interfaces?.replace("sentData: unknown", "sentData: InputType") ?? ''}
      `, globals: `
            type TransformationResponse = EditorSchema.TransformationRes;
            function delay<T extends EditorSchema.SenderResponse>(time: number, res: T): EditorSchema.Delayed<T>
            type ObjectType = TransformationResponse
      `
      }
    }
    if (!jsCache[node.uuid]) {
      cacheNodeScript(node)

    }
    if (!jsCache[node.uuid]?.tsCode?.length) {
      return
    }


    try {
      const nodePref = nodeTypeName(node)

      let typeName: string | false = `${nodePref}OutputType`

      const outputType = "any"


      let editorCode = `
        namespace ${nodePref}{
          ${connectionSchema.dts}

          type InputType=${connectionSchema.mainTypeName}


          // output type shouzld only be used as "satisfies OutputType" so its not relevant here
          type OutputType=${outputType}
          declare var context:any

          export ${jsCache[node.uuid].tsCode}\n
          }
          type ${nodePref}OutputType=ReturnType<typeof ${nodePref}.map>
        `
      const lastStatement = node.parameters?.mode === "object" || node.parameters?.mode === "switch"
      if (lastStatement) {
        typeName = false
        editorCode = `
        namespace ${nodePref}{

          ${globalTypesObjectValidation}

          ${node.runtimeContext.editorSchema!.dts}

      
           ${jsCache[node.uuid].tsCode}
        }
       `
      }

      const typeSchemaTimeout = setTimeout(() => {
        console.warn("type schema generation for " + node.uuid + " took long")

      }, 1000)
      const jsonSchema = await getTypes(editorCode, typeName, `${node.type}-output-gen--${node.uuid}`)
      clearTimeout(typeSchemaTimeout)

      if (jsonSchema) {
        allRequired(jsonSchema)

        if (JSON.stringify(jsonSchema) !== JSON.stringify(node.runtimeContext.outputSchema?.jsonSchema)) {

          genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateOutputSchema({
            nodeUuid: node.uuid,
            schema: {
              jsonSchema: jsonSchema,
              mainTypeName: "Main",
              dts: await generateDtsFromSchema(jsonSchema, `${node.type}-${node.uuid}-con type change`)
            }
          }))
        }
      }

    } catch (e) {
      if (e.message == "Not supported: root type undefined") {
        console.warn("undefined return type to functiuon")
      } else if (e instanceof CompilerError) {
        console.error(e)
      } else {

        throw e;
      }
    }
  },
  targetConnectionTypeChanged(node, schema) {
    updateServerContext(node, {
      outputSchema: schema
    })
    //if (node.serverContext.connectionSchema) {


    // updateEditorTypeSchema(node, node.serverContext.connectionSchema)
    //}
  },

})


function updateEditorTypeSchema(node: EvalNode<typeof genericTypes["opts"], typeof genericTypes["server_context"]>, connectionSchema: Schemata) {

  let outputSchemaStr = ""
  if (node.serverContext?.outputSchema) {

    outputSchemaStr = `

    namespace MapFncOutputTypeNS{
        ${node.serverContext?.outputSchema.dts}
    }

    
    type MapFncOutputType=MapFncOutputTypeNS.${node.serverContext?.outputSchema.mainTypeName}
    `

  }
  const newDts = `
${connectionSchema.dts}

type InputType=${connectionSchema.mainTypeName ??= mainTypeName}

${outputSchemaStr}
      `;
  const newGlobals = `
     // type InputType = EditorSchema.InputType;    
      var context;
      `;
  if (node.runtimeContext.editorSchema?.dts !== newDts || node.runtimeContext.editorSchema?.globals !== newGlobals) {
    genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateEditorSchema({
      nodeUuid: node.uuid,
      editorSchema: {
        dts: newDts,
        globals: newGlobals
      }
    }))
  }


}



function setNewCode(node: ElementNode, code: Omit<CodeData, "timestamp" | "node">) {
  const codeData: CodeData = {
    ...code,
    timestamp: Date.now(),
    node: node.uuid
  }
  genericNodeDataStore.dispatch(backendToFrontendStoreActions.updateParam({
    node: node.uuid,
    param: "code",
    value: JSON.stringify(codeData)
  }))
}


function cacheNodeScript(node: ElementNode<NodeDefToType<{ code: { type: "monaco"; default: string; }; }>, unknown, unknown>) {
  if (node.parameters?.code) {
    try {
      const codePAram = JSON.parse(node.parameters.code || '{}');
      const parsedCodeAData = codeSchema.parse(codePAram)
      if (parsedCodeAData) {
        let code = parsedCodeAData.jsCode
        if (code.startsWith("function map(input)")) {
          code = `(${code})(payload)`
        }

        const finalCode = code
        jsCache[node.uuid] = {
          finalCode,
          script: new Script(finalCode),
          ...parsedCodeAData
        };
      }
    } catch (e) {
      debugger
      throw e
    }
  }

  return jsCache[node.uuid]
}
