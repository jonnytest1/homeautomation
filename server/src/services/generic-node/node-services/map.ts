

import { generateDtsFromSchema, jsonSchemaFromDts } from '../json-schema-type-util';
import { addTypeImpl } from '../generic-node-service';
import type { ElementNode, NodeDefToType } from '../typing/generic-node-type';
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
    if (prevtsCode === jsCache[node.uuid].tsCode) {
      return
    }
    /*node.runtimeContext.connections?.incoming.forEach(incomingConnection => {
      incomingConnection.node?.runtimeContext.schema

    })*/
  },
  async connectionTypeChanged(node, connectionSchema) {

    if (!jsCache[node.uuid]) {
      cacheNodeScript(node)

    }

    const jsonSchema = jsonSchemaFromDts(`
      ${connectionSchema.dts}

      type InputType=${connectionSchema.mainTypeName}
      
      ${jsCache[node.uuid].tsCode}\n
      type OutputType=ReturnType<typeof map>
    `, "OutputType")

    if (jsonSchema) {
      node.runtimeContext.outputSchema = {
        jsonSChema: jsonSchema,
        dts: await generateDtsFromSchema(jsonSchema)
      }
    }
  }
})
function cacheNodeScript(node: ElementNode<NodeDefToType<{ code: { type: "monaco"; default: string; }; }>>) {
  if (node.parameters) {
    const codePAram = JSON.parse(node.parameters.code ?? '{}');
    const parsedCodeAData = codeSchema.parse(codePAram)
    if (parsedCodeAData) {
      jsCache[node.uuid] = {
        script: new Script(`(${parsedCodeAData.jsCode})(payload)`),
        ...parsedCodeAData
      };
    }
  }

  return jsCache[node.uuid]
}

