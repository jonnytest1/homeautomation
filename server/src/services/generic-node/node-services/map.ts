

import { CompilerError, allRequired, generateDtsFromSchema, generateJsonSchemaFromDts } from '../json-schema-type-util';
import { addTypeImpl } from '../generic-node-service';
import type { ElementNode } from '../typing/generic-node-type';
import type { NodeDefToType } from '../typing/node-options';
import { TscCompiler } from '../../../util/tsc-compiler';
import type { Delayed } from '../../../models/connection-response';
import { Json2dts } from "json2dts"
import * as z from "zod"
import { createCompilerHost } from 'typescript';
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
  tsCode: z.string()
})


const jsCache: Record<string, z.infer<typeof codeSchema> & { script: Script }> = {}
const isMapFunctionREgex = /function\s*map\s*\(\s*input\s*:\s*InputType/


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


addTypeImpl({
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
      payload: data.payload
    })
    data.updatePayload(returnValue)
    callbacks.continue(data)

  },
  nodeDefinition: () => ({
    inputs: 1,
    outputs: 1,
    type: "map",
    options: {
      code: {
        type: "monaco",
        default: `function map(input:InputType){\n\n}`
      }
    }
  }),
  nodeChanged(node, prev) {
    const prevtsCode = jsCache[node.uuid]?.tsCode
    cacheNodeScript(node);


  },
  async connectionTypeChanged(node, connectionSchema) {
    node.runtimeContext.editorSchema = {
      dts: `

   type MappedObject<T extends string> = {
  [key in T]: any
}

${connectionSchema.dts}

type InputType=${connectionSchema.mainTypeName}

${TscCompiler.responseINterface?.replace("sentData: unknown", "sentData: InputType") ?? ''}


declare function mapOnObject<T, K extends keyof T>(input: T, key: K, mapping: MappedObject<T[K] & string>)
      `
    }
    if (!jsCache[node.uuid]) {
      cacheNodeScript(node)

    }
    if (!jsCache[node.uuid]?.tsCode?.length) {
      return
    }


    try {

      let code = `
          ${connectionSchema.dts}

          type InputType=${connectionSchema.mainTypeName}
          
          ${jsCache[node.uuid].tsCode}\n
          type OutputType=ReturnType<typeof map>
        `
      let statementoverride: false | undefined = undefined
      if (!code.match(isMapFunctionREgex)) {
        statementoverride = false
        code = `
        ${node.runtimeContext.editorSchema.dts}

         ${jsCache[node.uuid].tsCode}`
      }


      const jsonSchema = generateJsonSchemaFromDts(code, statementoverride ?? "OutputType", `${node.type}-${node.uuid}-output gen`)

      allRequired(jsonSchema)

      if (jsonSchema) {
        node.runtimeContext.outputSchema = {
          jsonSchema: jsonSchema,
          mainTypeName: "Main",
          dts: await generateDtsFromSchema(jsonSchema, `${node.type}-${node.uuid}-con type change`)
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
  }
})
function cacheNodeScript(node: ElementNode<NodeDefToType<{ code: { type: "monaco"; default: string; }; }>>) {
  if (node.parameters) {
    const codePAram = JSON.parse(node.parameters.code ?? '{}');
    const parsedCodeAData = codeSchema.parse(codePAram)
    if (parsedCodeAData) {
      let code = parsedCodeAData.jsCode
      if (code.startsWith("function map(input)")) {
        code = `(${code})(payload)`
      }


      jsCache[node.uuid] = {
        script: new Script(code),
        ...parsedCodeAData
      };
    }
  }

  return jsCache[node.uuid]
}
