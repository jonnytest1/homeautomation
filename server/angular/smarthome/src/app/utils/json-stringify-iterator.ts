




interface Context {
  parents?: Array<any>,

  keys?: Array<string>
}

export function iterateJsonStringify(obj: any, context: Context = {}) {
  let initial = false
  if (!context.parents) {
    context.parents = []
    initial = true
  }
  if (!context.keys) {
    context.keys = [""]
  }
  if (typeof obj !== "object") {
    return obj
  }
  if ("toJSON" in obj) {
    const lastKey = context.keys.at(-1)
    const newObj = obj.toJSON(lastKey, context)
    context.parents.push(obj)
    obj = newObj
  }

  if (typeof obj !== "object") {
    return obj
  }
  obj = { ...obj }


  for (const key in obj) {

    obj[key] = iterateJsonStringify(obj[key], {
      ...context,
      keys: [...context.keys, key]
    })
  }

  if (initial) {
    return JSON.stringify(obj)
  }
  return obj
}