
import type { PreparedNodeData } from './typing/generic-node-type';
import type { Schemata } from './typing/schemata';
import type { ElementNode } from './typing/element-node';
import { CompilerError, allRequired, expansionType, generateDtsFromSchema, mainTypeName } from './json-schema-type-util';
import { getTypes, getWatcher } from './validation/watcher';
import { nodeDescriptor, nodeTypeName } from './element-node';
import { SchemaMatchingError, validateJsonSchema } from './validation/json-schema-type.validator';
import { genericNodeDataStore } from './generic-store/reference';
import { backendToFrontendStoreActions } from './generic-store/actions';
import { selectConnectionsFromNodeUuid, selectNodeByUuid, selectTargetConnectorForNodeUuid } from './generic-store/selectors';
import { validateMorph } from './validation/morph';
import { logKibana } from '../../util/log';
import { generateSchema } from 'typescript-json-schema';
import type { Diagnostic, DiagnosticMessageChain, DiagnosticRelatedInformation } from 'typescript';
import type { ExtendedJsonSchema } from 'json-schema-merger';
import type { ts } from 'ts-morph';

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

  const connectionsTargetingCurrentNode = genericNodeDataStore.getOnce(selectTargetConnectorForNodeUuid(node.uuid))
  if (connectionsTargetingCurrentNode) {
    const allConnectorsToConnection0 = connectionsTargetingCurrentNode[0]
    const schemata = await Promise.all(allConnectorsToConnection0.map(async con => {
      const connectionNode = genericNodeDataStore.getOnce(selectNodeByUuid(con.source.uuid))
      if (!connectionNode) {
        debugger
      }
      const compSchema = connectionNode.runtimeContext.outputSchema
      if (compSchema?.dts && node.runtimeContext.inputSchema) {
        const nodeTypePrefix = nodeTypeName(node)
        let diagnosicsFiles: ReadonlyArray<ts.Diagnostic> | undefined
        try {
          const connectionNodePrefi = nodeTypeName(connectionNode)

          validateJsonSchema({
            target: node.runtimeContext.inputSchema.jsonSchema,
            assigning: compSchema.jsonSchema,
            path: []
          })

          const str = `

      namespace ${nodeTypePrefix}_NodeWrapper {
        namespace ConnectionInput {

          ${compSchema?.dts}
        }

        namespace ${nodeTypePrefix}_NodeInput {
          
          ${node.runtimeContext.inputSchema.dts}
        }

        ${expansionType}
        
        type ${connectionNodePrefi}_ExpandedConInput = ExpandRecursively<ConnectionInput.${mainTypeName}>
        type ${nodeTypePrefix}_ExpandedNodeInput = ExpandRecursively<${nodeTypePrefix}_NodeInput.${mainTypeName}>

        declare let cinInput:${connectionNodePrefi}_ExpandedConInput

        const nodeInput: ${nodeTypePrefix}_ExpandedNodeInput = cinInput

        type ResultType=${nodeTypePrefix}_NodeInput.${mainTypeName}
    }
`;
          await validateMorph(str, `${node.type}-${node.uuid}-con input check`, {
            extractor(p, file) {
              //nothin
            },
            preerror(diagnostics) {
              diagnosicsFiles = diagnostics

            },
          })

          genericNodeDataStore.dispatch(backendToFrontendStoreActions.setConnectionError({
            connection: con.uuid,
            error: undefined
          }))
        } catch (e) {

          if (e instanceof SchemaMatchingError) {
            genericNodeDataStore.dispatch(backendToFrontendStoreActions.setConnectionError({
              connection: con.uuid,
              error: e.toMessageString()
            }))

          } else {
            let firstError = e as DiagnosticRelatedInformation | DiagnosticMessageChain
            if (e instanceof CompilerError) {
              firstError = e.error_diagnostics[0] as Diagnostic
            }

            while (typeof firstError.messageText != "string" && firstError.messageText?.next?.[0]) {
              firstError = firstError.messageText.next?.[0]
            }
            if (typeof firstError.messageText == "string") {
              let messageText = firstError.messageText

              for (const subType of ["ExpandedConInput", "ExpandedNodeInput"])
                if (messageText.includes(subType)) {


                  const w = getWatcher().copy(e.program)
                  const diagnosticFile = diagnosicsFiles?.[0]?.file;
                  if (diagnosticFile) {
                    // as unknown as SourceFile
                    w.addSourceFile(diagnosticFile)

                    const typeName = nodeTypePrefix + "_" + subType;
                    try {
                      const subSchema = generateSchema(e.program, typeName, { ignoreErrors: true }, undefined, w.getSchemaGenerator())
                      if (subSchema) {
                        let dtsrelace = await generateDtsFromSchema(subSchema as ExtendedJsonSchema, `${node.type}-${node.uuid}-err handling resolve`)
                        dtsrelace = dtsrelace.trim().replace("export type Main = ", "").replace(/;$/, "").trim()
                        messageText = messageText.replace(typeName, dtsrelace)
                      }
                    } catch (e) {
                      logKibana("WARN", "error wihle replacing type in error", e)
                    }
                  }


                  //w.getTypeDefinition()


                }
              genericNodeDataStore.dispatch(backendToFrontendStoreActions.setConnectionError({
                connection: con.uuid,
                error: messageText
              }))
            } else {
              debugger;
            }

          }


        }
      }
      return {
        schema: compSchema,
        nodeUuidType: nodeTypeName(connectionNode)
      }
    }))
    const filteredSchemas = schemata.filter((sch): sch is NonNullable<typeof sch> => !!sch?.schema)
    if (filteredSchemas.length > 0) {
      schema = filteredSchemas[0].schema || null
      if (filteredSchemas.length > 1) {
        const schemaDtss = filteredSchemas.map(schema => `
            namespace ${schema.nodeUuidType} {
                ${schema.schema?.dts}
            }
          `)
        const mergingDts = `

          ${schemaDtss.join("\n\n")}

          type ${mainTypeName}=${filteredSchemas.map(s => `${s.nodeUuidType}.${mainTypeName}`).join("|")}
        `
        try {
          const mergedSchema = await getTypes(mergingDts, mainTypeName, `connection-type-merge-${node.uuid}`)
          allRequired(mergedSchema)
          schema = {
            jsonSchema: mergedSchema,
            mainTypeName: mainTypeName,
            dts: await generateDtsFromSchema(mergedSchema)
          }
        } catch (e) {
          const err = new Error("error getting merged type for " + filteredSchemas.length + " connections on node " + nodeDescriptor(node), { cause: e, });
          err["mergingDts"] = mergingDts
          throw err
        }
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
  const conChangeTimeout = setTimeout(() => {
    console.warn("type schema update for " + node.uuid + " took long")

  }, 1000)
  if (!nodeTypeImplemenations) {
    debugger
  }
  await nodeTypeImplemenations.connectionTypeChanged?.(node, schema);
  clearTimeout(conChangeTimeout)
  if (node.runtimeContext?.editorSchema?.dts) {
    // just for debuging ... probably
    //  writeFile(join(typeData, `editorschema_${node.uuid}.ts`), node.runtimeContext?.editorSchema.dts)
  }

  const outConnections = genericNodeDataStore.getOnce(selectConnectionsFromNodeUuid(node.uuid))
  try {
    if (outConnections) {
      for (const connectorIndex in outConnections) {
        for (const connector of outConnections[connectorIndex] ?? []) {
          try {
            const nextNode = genericNodeDataStore.getOnce(selectNodeByUuid(connector.uuid))

            const logTimeout = setTimeout(() => {
              console.warn("type schema update for " + nextNode.uuid + " took long")

            }, 1000)
            await updateTypeSchema(nextNode, nodeData)
            clearTimeout(logTimeout)
          } catch (e) {
            debugger;
            throw new Error("error validating node " + connector.uuid, {
              cause: e
            })
          }
        }
      }
    }
  } catch (e) {

    debugger;
    throw e;
  }
}




