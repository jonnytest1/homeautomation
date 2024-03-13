


import type { ExtendedJsonSchema } from '../typing/generic-node-type'
import { generateDtsFromSchema, generateZodTypeFromSchema, mainTypeName } from '../json-schema-type-util'
import { addTypeImpl } from '../generic-node-service'
import type { ZodType } from 'zod'

function createSchema(schemaOBject: unknown) {
  const schema: ExtendedJsonSchema = {}

  if (typeof schemaOBject == "object") {
    schema.type = "object"
    schema.properties ??= {}
    schema.additionalProperties = false
    schema.required = []
    for (const key in schemaOBject) {
      schema.properties[key] = createSchema(schemaOBject[key])
      schema.required.push(key)

    }
  } else if (typeof schemaOBject == "string") {
    schema.type = "string"
    schema.enum ??= []
    schema.enum.push(schemaOBject)

    if (!isNaN(+new Date(schemaOBject))) {
      delete schema.enum
      schema.format = "date-time"
    }

  } else if (typeof schemaOBject == "number") {
    schema.type = "number"
    schema.enum ??= []
    schema.enum.push(schemaOBject)
  }
  return schema
}


type MergeSchemaOptions = {
  old: ExtendedJsonSchema,
  new: ExtendedJsonSchema,
  enumKeyList: Array<string>,
  path: Array<string>,
  params: {
    mergeLength: string,
    [key: `mergeLength_${string}`]: string
  }
}

function getLimitForPath(opts: MergeSchemaOptions) {
  const params = opts.params
  const pathKey = `mergeLength_${opts.path.join(".")}`

  if (pathKey in params) {
    return +params[pathKey]
  }
  return +params.mergeLength
}


//old: ExtendedJsonSchema, newSchema: ExtendedJsonSchema, enumKeyList: Array<string>, path: Array<string> = []
function mergeSchema(opts: MergeSchemaOptions): ExtendedJsonSchema {
  const old = opts.old
  const newSchema = opts.new

  if (old.type === newSchema.type) {
    if (old.type == "object") {
      const oldProps = old.properties
      if (!oldProps) {
        debugger
        throw new Error("no properties on object")
      }
      const keysOld = Object.keys(oldProps)
      const newProps = newSchema.properties ?? {}
      const keysNew = new Set(Object.keys(newProps))

      const oldKeys = new Set(keysOld)
      keysNew.forEach(key => oldKeys.delete(key))
      keysOld.forEach(key => keysNew.delete(key))
      if (oldKeys.size == 0 && keysNew.size == 0) {
        old.required ??= []
        for (const key of keysOld) {
          const oldKeyProp = oldProps[key]
          const newKeyProp = newProps[key]
          if (oldKeyProp && typeof oldKeyProp == "object" && newKeyProp && typeof newKeyProp == "object") {
            mergeSchema({
              ...opts,
              old: oldKeyProp,
              new: newKeyProp,
              path: [...opts.path, key],
            })
          }

          if (typeof old.required == "object" && !old.required.includes(key)) {
            if (!old._optional?.includes(key)) {
              old.required.push(key)
            }
          }
        }
        old.additionalProperties = false
        return old
      } else if (keysNew.size > 0) {
        old.required ??= []
        for (const key of keysOld) {
          const oldKeyProp = oldProps[key]
          const newKeyProp = newProps[key]
          if (oldKeyProp && typeof oldKeyProp == "object" && newKeyProp && typeof newKeyProp == "object") {
            mergeSchema({
              ...opts,
              old: oldKeyProp,
              new: newKeyProp,
              path: [...opts.path, key],
            })
          }

          if (typeof old.required == "object" && !old.required.includes(key)) {
            if (!old._optional?.includes(key)) {
              old.required.push(key)
            }
          }
        }
        for (const newKey of keysNew) {
          oldProps[newKey] = newProps[newKey]
        }
        return old
      } else if (oldKeys.size > 0) {
        old.required ??= []
        old._optional ??= []

        for (const okey of oldKeys) {
          if (!old._optional.includes(okey)) {
            old._optional.push(okey)
          }
          old.required = old.required?.filter(key => key !== okey)
        }
        for (const key of keysOld) {
          const oldKeyProp = oldProps[key]
          const newKeyProp = newProps[key]
          if (oldKeyProp && typeof oldKeyProp == "object" && newKeyProp && typeof newKeyProp == "object") {
            mergeSchema({
              ...opts,
              old: oldKeyProp,
              new: newKeyProp,
              path: [...opts.path, key],
            })
          }

          if (typeof old.required == "object" && !old.required.includes(key)) {
            if (!old._optional?.includes(key)) {
              old.required.push(key)
            }
          }
        }
        return old
      }
      debugger
    } else if (old.type == "string") {
      if (old.format !== newSchema.format) {
        debugger;
      }
      if (old.merged) {
        return old
      }
      if (old.enum && newSchema.enum) {
        old.enum = [...new Set([...old.enum, ...newSchema.enum])]

        if (old.enum.every(val => typeof val == "string" && !isNaN(+new Date(val)))) {
          old.format = "date-time"
        } else {
          delete old.format
        }

        const limit = getLimitForPath(opts)
        if (old.enum.length > limit) {
          old.merged = true
          delete old.enum
        } else {
          opts.enumKeyList.push(opts.path.join("."))
        }

      }
    } else if (old.type == "number") {
      if (old.merged) {
        return old
      }
      if (old.enum && newSchema.enum) {
        old.enum = [...new Set([...old.enum, ...newSchema.enum])]

        const limit = getLimitForPath(opts)
        if (old.enum.length > limit) {
          old.merged = true
          delete old.enum
        } else {
          opts.enumKeyList.push(opts.path.join("."))
        }
      } else {
        debugger
      }
    } else {
      debugger
    }
    return old
  } else {
    debugger;
    return {
      oneOf: [
        old,
        newSchema
      ]
    }
  }
}


function updateSchema(newObject: unknown, oldSchema: ExtendedJsonSchema | null, enumKeyList: Array<string>, params: MergeSchemaOptions["params"]) {
  const newSchema = createSchema(newObject)
  if (oldSchema) {
    const merged = mergeSchema({
      old: oldSchema,
      new: newSchema,
      enumKeyList: enumKeyList,
      path: [],
      params
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
      const updated = updateSchema(
        data.payload,
        node.runtimeContext?.outputSchema?.jsonSchema ?? null,
        enumKeyList,
        {
          ...node.parameters,
          mergeLength: node.parameters?.mergeLength ?? "10"
        }
      )
      node.parameters ??= {}
      node.runtimeContext.parameters ??= {}

      let hasChange = false
      const enumSet = new Set(enumKeyList)
      for (const key in node.runtimeContext.parameters) {
        if (key.startsWith("mergeLength_")) {
          const prop = key.split("mergeLength_")[1]
          if (!enumSet.has(prop)) {
            hasChange = true
            delete node.runtimeContext.parameters[key]
          }
        }
      }
      for (const enumKey of enumKeyList) {
        const newPArameter = {
          type: "number",
          title: "if an enum length exceeds this length it will be merged into a parent type 'a'|'b' => string"
        }
        if (JSON.stringify(newPArameter) !== JSON.stringify(node.runtimeContext.parameters[`mergeLength_${enumKey}`])) {
          node.runtimeContext.parameters[`mergeLength_${enumKey}`] = newPArameter
          hasChange = true
        }
        const newMErgeLength = node.parameters?.mergeLength ? +node.parameters?.mergeLength : 10
        if (newMErgeLength !== node.parameters[`mergeLength_${enumKey}`]) {
          node.parameters[`mergeLength_${enumKey}`] = newMErgeLength
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
      }
    }
  }),
  nodeChanged(node, prevNode) {
    node.parameters ??= {}
    node.parameters.mergeLength ??= "10"
  },
})