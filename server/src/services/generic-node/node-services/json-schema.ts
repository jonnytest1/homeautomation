



import { generateDtsFromSchema, generateZodTypeFromSchema, mainTypeName } from '../json-schema-type-util'
import { addTypeImpl } from '../generic-node-service'
import type { ZodType } from 'zod'

import { createSchema, mergeSchema, type ExtendedJsonSchema, type MergeSchemaOptions } from "json-schema-merger"

function updateSchema(newObject: unknown, oldSchema: ExtendedJsonSchema | null, enumKeyList: Array<string>, params: MergeSchemaOptions["params"]) {
  const dateFnc = (date: string) => date !== "0" && !isNaN(+new Date(date))
  const newSchema = createSchema(newObject, {
    isDate: dateFnc
  })
  if (oldSchema) {
    const merged = mergeSchema({
      old: oldSchema,
      new: newSchema,
      enumKeyList: enumKeyList,
      path: [],
      params,
      isDate: dateFnc
    })
    return merged
  }

  return newSchema

}


const zodMap: Record<string, Promise<ZodType>> = {}

addTypeImpl({
  async process(node, data, callbacks) {
    if (typeof data.payload == "string") {
      try {
        data.updatePayload(JSON.parse(data.payload))
      } catch (w) {
        //
      }
    }
    //const jsonSchema = json2dts.parse(data.payload, mainInterfaceName)

    const prevSChema = JSON.stringify(node.runtimeContext?.outputSchema?.jsonSchema)


    try {
      const enumKeyList: Array<string> = []

      const params: MergeSchemaOptions["params"] = {
        mergeLength: 10
      }

      for (const param in node.parameters ?? {}) {
        const paramKey = param as keyof typeof node.parameters
        const paramValue = node.parameters?.[paramKey]
        if (paramValue !== undefined && param.startsWith("mergeLength_")) {
          params[paramKey] = +paramValue
        }
      }

      const updated = updateSchema(
        data.payload,
        node.runtimeContext?.outputSchema?.jsonSchema ?? null,
        enumKeyList,
        params
      )

      if (updated.oneOf) {
        throw new Error("shouldnt be one of")
      }


      node.parameters ??= {}
      node.runtimeContext.parameters ??= {}

      let hasChange = false
      const enumSet = new Set(enumKeyList)
      for (const key in node.runtimeContext.parameters) {
        const paramKey = key as keyof typeof node.runtimeContext.parameters
        if (paramKey.startsWith("mergeLength_")) {
          const prop = paramKey.split("mergeLength_")[1]
          if (!enumSet.has(prop)) {
            hasChange = true
            delete node.runtimeContext.parameters[paramKey]
          }
        }
      }
      for (const enumKey of enumKeyList) {
        const newPArameter = {
          type: "number",
          title: "if an enum length exceeds this length it will be merged into a parent type 'a'|'b' => string"
        }
        const propKey = `mergeLength_${enumKey}` as const
        const runtimeParamRef = node.runtimeContext.parameters as Record<typeof propKey, typeof newPArameter>
        if (JSON.stringify(newPArameter) !== JSON.stringify(runtimeParamRef[propKey])) {
          runtimeParamRef[propKey] = newPArameter
          hasChange = true
        }
        const paramRef = node.parameters as Record<typeof propKey, number>
        const newMErgeLength = node.parameters?.mergeLength ? +node.parameters?.mergeLength : 10
        if (newMErgeLength !== paramRef[propKey]) {
          paramRef[propKey] = newMErgeLength
          hasChange = true
        }
      }

      if (JSON.stringify(updated) !== prevSChema) {
        node.runtimeContext.outputSchema = {
          jsonSchema: updated,
          mainTypeName,
          dts: await generateDtsFromSchema(updated, `${node.type}-${node.uuid}-process !!`)
        }
        zodMap[node.uuid] = generateZodTypeFromSchema(updated, `${node.type}-${node.uuid}-process!!`)
        hasChange = true
      }
      if (hasChange) {
        callbacks.updateNode()
      }
    } catch (e) {
      debugger
    }
    if (node.runtimeContext?.outputSchema?.jsonSchema) {

      try {
        if (!zodMap[node.uuid]) {
          zodMap[node.uuid] = generateZodTypeFromSchema(node.runtimeContext?.outputSchema?.jsonSchema, `${node.type}-${node.uuid}-process fallback`)
        }
        const schema = await zodMap[node.uuid]
        data.updatePayload(await schema.parse(data.payload))
      } catch (e) {
        debugger
        throw e;
      }

    }
    //const newSchema = json2dts.getCode()
    //node.runtimeContext.schema = newSchema
    /* if (prevSChema !== newSchema) {
       if (prevSChema && newSchema) {
         const mergedSChema = typeMerge(prevSChema, newSchema, mainInterfaceName)
         debugger
       }
       //merge schema
       callbacks.updateNode()
     }*/

    callbacks.continue(data)
  },
  nodeDefinition: () => ({
    inputs: 1,
    outputs: 1,
    type: "jsonschema",
    options: {
      mergeLength: {
        type: "number"
      },
      reset: {
        type: "button"
      }
    }
  }),
  nodeChanged(node, prevNode) {
    node.parameters ??= {}
    node.parameters.mergeLength ??= "10"
  },
})