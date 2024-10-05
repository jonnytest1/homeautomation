import type { ExtendedJsonSchema } from 'json-schema-merger'



interface ValidationContext {
  path: Array<string>
  target: ExtendedJsonSchema,
  assigning: ExtendedJsonSchema,

  initialTarget?: ExtendedJsonSchema,
  initialAssigning?: ExtendedJsonSchema
}

export class SchemaMatchingError extends Error {


  constructor(public context: ValidationContext, message: string) {
    super(message)
    console.warn(message)
  }


  toMessageString() {
    return `${this.message} at /${this.context.path.join("/")}`
  }
}



export function validateJsonSchema(context: ValidationContext) {
  if (!context.initialAssigning) {
    context.initialAssigning = context.assigning
  }
  if (!context.initialTarget) {
    context.initialTarget = context.target
  }
  let target = context.target
  let assigning = context.assigning

  if (target.$ref) {
    const ref = target.$ref.split("#/definitions/")[1]

    const definitionTarget = context.initialTarget.definitions?.[ref]

    if (!definitionTarget) {
      debugger;
      throw new Error("definition doesnt exist " + ref)
    }
    target = definitionTarget as ExtendedJsonSchema
  }
  if (assigning.$ref) {
    const ref = assigning.$ref.split("#/definitions/")[1]

    const definitionTarget = context.initialAssigning.definitions?.[ref]

    if (!definitionTarget) {
      debugger;
      throw new Error("definition doesnt exist " + ref)
    }
    assigning = definitionTarget as ExtendedJsonSchema
  }

  if (target.$ref || assigning.$ref) {
    debugger
  }

  if (!target.type || !assigning.type) {
    if (target.anyOf) {
      let foundMatch = false;
      const errors: Array<SchemaMatchingError> = []
      for (let i = 0; i < target.anyOf.length; i++) {
        const schemaOption = target.anyOf[i]
        try {
          validateJsonSchema({
            ...context,
            target: schemaOption as ExtendedJsonSchema,
            assigning: assigning,
            path: [...context.path, `[_${i}]`]
          })
          //target = schemaOption
          foundMatch = true
        } catch (e) {
          errors.push(e)
        }
      }

      if (!foundMatch) {
        throw new SchemaMatchingError(context, "didnt match any schema")
      }
      return
      // done
    } else {
      throw new SchemaMatchingError(context, "invalid schema type")
    }


  }
  if (target.type !== assigning.type) {
    throw new SchemaMatchingError(context, `different schema Types ${target.type} and ${assigning.type}`)
  }
  if (target.type === "object") {
    const targetProps = target.properties ?? {}
    const assigningProps = assigning.properties ?? {}

    const requiredTargetProps = new Set(target.required ?? [])
    const requiredAssigningProps = new Set(assigning.required ?? [])
    for (const property in targetProps) {
      if (!(property in assigningProps)) {
        if (requiredTargetProps.has(property)) {
          throw new SchemaMatchingError(context, `property ${property} is missing`)
        }
      } else {
        validateJsonSchema({
          ...context,
          target: targetProps[property] as ExtendedJsonSchema,
          assigning: assigningProps[property] as ExtendedJsonSchema,
          path: [...context.path, property]
        })
      }


      if (requiredTargetProps.has(property)) {
        if (!requiredAssigningProps.has(property)) {
          throw new SchemaMatchingError(context, `property ${property} is required in target type but optional in assigning type`)
        }
      }

    }
  } else if (target.type === "number") {
    if (target.const) {
      debugger
    }
    if (target.enum) {
      debugger
    }
  } else if (target.type === "boolean") {
    if (target.const) {
      debugger
    }
    if (target.enum) {
      debugger
    }
  } else if (target.type === "string") {
    if (target.const) {
      debugger
    }
    if (target.enum) {
      if (assigning.const) {
        if (!target.enum.includes(assigning.const)) {
          throw new SchemaMatchingError(context, `constant '${assigning.const}' is not part of the target enum ${target.enum.join(",")}`)
        }
      } else {

        debugger
      }
    }
    if (target.format) {
      debugger
    }
  } else {
    debugger
  }

}