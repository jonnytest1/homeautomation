
import type { ElementNode, ExtendedJsonSchema, PreparedNodeData, SchemaCollection } from './generic-node-type';
import { CompilerError, expansionType, generateDtsFromSchema, generateZodTypeFromSchema, jsonSchemaFromDts, mainTypeName } from './json-schema-type-util';
import { typeData } from './generic-node-constants';
import { logKibana } from '../../util/log';
import * as z from "zod"
import { generateSchema } from 'typescript-json-schema';
import { join, dirname } from "path"
import { writeFile, mkdir } from "fs/promises"

const schemaMap: Record<string, SchemaCollection> = {}

export async function parseTypeSafe(node: ElementNode<unknown>, data: unknown) {
  let validator = schemaMap[node.uuid]?.zodValidator
  if (!validator) {
    const schema = await getComputeSchema(node)
    if (schema === null) {
      throw new Error("trying to get zod validator but no schema")
    }
    validator = schema!.zodValidator
  }
  return validator.parse(data)
}

async function getComputeSchema(node: ElementNode<unknown>) {
  if (!node.runtimeContext?.outputSchema?.jsonSChema) {
    return null
  }
  const schemaString = JSON.stringify(node.runtimeContext?.outputSchema?.jsonSChema)
  let nodeCahce = schemaMap[node.uuid]
  if (!nodeCahce || schemaString !== nodeCahce.schemaCache) {
    const [dts, zodParser] = await Promise.all([
      generateDtsFromSchema(node.runtimeContext?.outputSchema?.jsonSChema),
      generateZodTypeFromSchema(node.runtimeContext?.outputSchema?.jsonSChema)
    ])
    nodeCahce = schemaMap[node.uuid] = {
      schemaCache: schemaString,
      dts: dts,
      zodValidator: zodParser,
      mainTypeName: mainTypeName
    }
    const target = join(typeData, node.uuid + ".ts");
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, dts)
  }
  return nodeCahce
}

export async function updateTypeSchema(node: ElementNode, nodeData: PreparedNodeData) {
  let schema: SchemaCollection | null = null
  if (nodeData.targetConnectorMap[node.uuid]) {

    const schemata = await Promise.all(nodeData.targetConnectorMap[node.uuid].map(async con => {
      const connectionNode = nodeData.nodeMap[con.uuid]
      const compSchema = await getComputeSchema(connectionNode)
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
          const result = jsonSchemaFromDts(str, "ResultType")
          delete con.error
        } catch (e) {
          if (e instanceof CompilerError) {
            const firstError = e.error_diagnostics?.[0]
            if (typeof firstError.messageText == "string") {
              let messageText = firstError.messageText

              for (const subType of ["ExpandedConInput", "ExpandedNodeInput"])
                if (messageText.includes(subType)) {
                  const subSchema = generateSchema(e.program, subType, { ignoreErrors: true })
                  if (subSchema) {
                    let dtsrelace = await generateDtsFromSchema(subSchema as ExtendedJsonSchema)
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
    const filteredSchemas = schemata.filter(sch => sch !== null)
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
      zodValidator: z.never(),
      schemaCache: "",
      mainTypeName
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