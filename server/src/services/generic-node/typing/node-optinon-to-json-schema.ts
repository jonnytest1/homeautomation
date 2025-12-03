
import type { NodeOptionTypes, PlaceHolder } from './node-options'
import type { ExtendedJsonSchema } from 'json-schema-merger'

export function argumentTypeToJsonSchema(arg: NodeOptionTypes<string> | PlaceHolder): ExtendedJsonSchema {
  if (arg.type === "select") {
    return {
      type: "string",
      enum: [...arg.options]
    }
  } else if (arg.type === "number") {
    return {
      type: "number"
    }
  } else if (arg.type == "text") {
    return {
      type: "string"
    }
  } else if (arg.type == "boolean") {
    return {
      type: "boolean"
    }
  } else if (arg.type === "monaco" && arg.mode === "html") {
    return {
      type: "string"
    }
  } else if (arg.type === "placeholder") {
    try {
      const ofType = argumentTypeToJsonSchema({
        type: arg.of
      } as NodeOptionTypes<string>)
      return ofType
    } catch (e) {
      return {
        type: "object",
        additionalProperties: true,
      }
    }
  } else {
    throw new Error("invalid argument type " + arg.type)
  }

}