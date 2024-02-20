
import type { ElementNode, ExtendedJsonSchema, PreparedNodeData, Schemata } from './typing/generic-node-type';
import { CompilerError, expansionType, generateDtsFromSchema, generateJsonSchemaFromDts, mainTypeName } from './json-schema-type-util';
import { typeData } from './generic-node-constants';
import { logKibana } from '../../util/log';
import { generateSchema } from 'typescript-json-schema';
import type { DiagnosticMessageChain, DiagnosticRelatedInformation } from 'typescript';
import { join } from "path"
import { writeFile } from "fs/promises"

/*
export async function parseTypeSafe(node: ElementNode<unknown>, data: unknown) {
  let validator = schemaMap[node.uuid]?.zodValidator
  if (!validator) {
    const schema = await getComputeSchema(node)
    if (schema === null) {
      throw new Error("trying to get zod validator but no schema")
    }
    validator = schema!.zodValidator
  }
  try {
    return validator.parse(data)
  } catch (e) {
    debugger;
    throw e;
  }
}*/
/*
async function getComputeSchema(node: ElementNode<unknown>) {
  if (!node.runtimeContext?.outputSchema?.jsonSChema) {
    return null
  }
  const schemaString = JSON.stringify(node.runtimeContext?.outputSchema?.jsonSChema)
  let nodeCahce = schemaMap[node.uuid]
  if (!nodeCahce || schemaString !== nodeCahce.schemaCache) {
    const [dts] = await Promise.all([
      generateDtsFromSchema(node.runtimeContext?.outputSchema?.jsonSChema),
      // generateZodTypeFromSchema(node.runtimeContext?.outputSchema?.jsonSChema)
    ])
    nodeCahce = schemaMap[node.uuid] = {
      schemaCache: schemaString,
      dts: dts,
      //zodValidator: zodParser,
      mainTypeName: mainTypeName
    }
    const target = join(typeData, node.uuid + ".ts");
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, dts)
  }
  return nodeCahce
}*/

export async function updateTypeSchema(node: ElementNode, nodeData: PreparedNodeData) {
  let schema: Schemata | null = null
  const connectionsTargetingCurrentNode = nodeData.targetConnectorMap[node.uuid];
  if (connectionsTargetingCurrentNode) {

    const schemata = await Promise.all(connectionsTargetingCurrentNode.map(async con => {
      const connectionNode = nodeData.nodeMap[con.uuid]
      const compSchema = connectionNode.runtimeContext.outputSchema
      if (compSchema?.dts && node.runtimeContext.inputSchema) {
        try {
          const str = `
    namespace ConnectionInput {

      ${compSchema?.dts}
    }

    namespace NodeInput {
      
      ${node.runtimeContext.inputSchema.dts}
    }

    ${expansionType}
    
    type ExpandedConInput = ExpandRecursively<ConnectionInput.${mainTypeName}>
    type ExpandedNodeInput = ExpandRecursively<NodeInput.${mainTypeName}>

    declare let cinInput:ExpandedConInput

    const nodeInput: ExpandedNodeInput = cinInput

    type ResultType=NodeInput.${mainTypeName}
`;
          writeFile(join(typeData, `${node.uuid}__${connectionNode.uuid}.ts`), str)
          const result = generateJsonSchemaFromDts(str, "ResultType", `${node.type}-${node.uuid}-con input check`)
          delete con.error
        } catch (e) {
          if (e instanceof CompilerError) {
            let firstError = e.error_diagnostics?.[0] as DiagnosticRelatedInformation | DiagnosticMessageChain

            while (typeof firstError.messageText != "string" && firstError.messageText?.next?.[0]) {
              firstError = firstError.messageText.next?.[0]
            }
            if (typeof firstError.messageText == "string") {
              let messageText = firstError.messageText

              for (const subType of ["ExpandedConInput", "ExpandedNodeInput"])
                if (messageText.includes(subType)) {
                  const subSchema = generateSchema(e.program, subType, { ignoreErrors: true })
                  if (subSchema) {
                    let dtsrelace = await generateDtsFromSchema(subSchema as ExtendedJsonSchema, `${node.type}-${node.uuid}-err handling resolve`)
                    dtsrelace = dtsrelace.trim().replace("export type Main = ", "").replace(/;$/, "").trim()
                    messageText = messageText.replace(subType, dtsrelace)
                  }
                }

              con.error = messageText
            } else {
              debugger;
            }
          }

        }
      }
      return compSchema
    }))
    const filteredSchemas = schemata.filter((sch): sch is NonNullable<typeof sch> => !!sch)
    if (filteredSchemas.length > 0) {
      schema = filteredSchemas[0]
      if (filteredSchemas.length > 1) {
        debugger
      }
    }

  }

  if (schema == null) {
    schema = {
      dts: `type ${mainTypeName}=any`,
      //zodValidator: z.never(),
      jsonSchema: {},
      mainTypeName: "Main"
    }
  }
  if (!schema?.dts) {
    logKibana("WARN", "no schema")
    return
  }


  const nodeTypeImplemenations = nodeData.typeImpls[node.type]

  await nodeTypeImplemenations.connectionTypeChanged?.(node, schema);

  const outConnections = nodeData.connectorMap[node.uuid]

  if (outConnections) {
    for (const connector of outConnections) {
      await updateTypeSchema(nodeData.nodeMap[connector.uuid], nodeData)
    }
  }
}




