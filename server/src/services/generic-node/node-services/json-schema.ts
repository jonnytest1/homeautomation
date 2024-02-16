


import type { ExtendedJsonSchema } from '../typing/generic-node-type'
import { generateDtsFromSchema, generateZodTypeFromSchema } from '../json-schema-type-util'
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

function mergeSchema(old: ExtendedJsonSchema, newSchema: ExtendedJsonSchema): ExtendedJsonSchema {

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
            mergeSchema(oldKeyProp, newKeyProp)
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
            mergeSchema(oldKeyProp, newKeyProp)
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
        for (const okey of oldKeys) {
          old._optional ??= []
          if (!old._optional.includes(okey)) {
            old._optional.push(okey)
          }
          old.required = old.required?.filter(key => key !== okey)
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
        if (old.enum.length > 10) {
          old.merged = true
          delete old.enum
        }
      }
    } else if (old.type == "number") {
      if (old.merged) {
        return old
      }
      if (old.enum && newSchema.enum) {
        old.enum = [...new Set([...old.enum, ...newSchema.enum])]

        if (old.enum.length > 10) {
          old.merged = true
          delete old.enum
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


function updateSchema(newObject: unknown, oldSchema: ExtendedJsonSchema | null) {
  const newSchema = createSchema(newObject)
  if (oldSchema) {
    const merged = mergeSchema(oldSchema, newSchema)
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

    const prevSChema = JSON.stringify(node.runtimeContext?.outputSchema?.jsonSChema)


    try {
      const updated = updateSchema(data.payload, node.runtimeContext?.outputSchema?.jsonSChema ?? null)
      if (JSON.stringify(updated) !== prevSChema) {
        node.runtimeContext.outputSchema = {
          jsonSChema: updated,
          dts: await generateDtsFromSchema(updated)
        }
        zodMap[node.uuid] = generateZodTypeFromSchema(updated)
        callbacks.updateNode()
      }
    } catch (e) {
      debugger
    }
    if (node.runtimeContext?.outputSchema?.jsonSChema) {
      try {
        if (!zodMap[node.uuid]) {
          zodMap[node.uuid] = generateZodTypeFromSchema(node.runtimeContext?.outputSchema?.jsonSChema)
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
    type: "jsonschema"
  })
})