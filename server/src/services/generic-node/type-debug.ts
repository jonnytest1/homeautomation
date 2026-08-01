import { updateRuntimeParameter } from './element-node-fnc';
import type { EvalNode, NullTypeSubject, TypeImplementaiton } from './typing/generic-node-type';
import { wrapPlaceholder, type NodeDefOptinos, type NodeDefToRUntime, type Select } from './typing/node-options';

if (3 > 1 + Math.random()) {
  throw new Error("this should never run - just type check")
}

type Prettify<T> = T extends Array<infer U>
  ? Array<Prettify<U>>
  : ({
    [K in keyof T]: Prettify<T[K]>
  } & {});


function implFnc<C, G extends NodeDefOptinos, O extends NodeDefOptinos, P, S, TS extends NullTypeSubject>(typeImpl: TypeImplementaiton<C, G, O, P, S, TS>) {
  return typeImpl
}



type ViewTypes = "view-output" | "view-input" | "collection"
const example = implFnc({
  context_type(c: { viewsource: Array<string> }) {
    return c
  },
  nodeDefinition() {
    return {
      type: "exampletype",
      inputs: 1,
      outputs: 0,
      options: {
        example1: {
          type: "select",
          options: ["test", "abc"] as const
        },
        example2: wrapPlaceholder<Select<ViewTypes>>()({
          type: "placeholder",
          of: "select",
          invalidates: ["target"]
        }),
        example3: {
          type: "placeholder",
          of: "select",
          invalidates: ["target"]
        },
        ex4: {
          type: "number",
          title: "input history days",
          hideWithoutValue: true
        }
      }
    }
  },
  nodeChanged(node, prevNode) {
    type N = typeof node
    type O = N extends EvalNode<infer Ps extends NodeDefOptinos, infer S> ? Ps : never

    type RuntimeType = NodeDefToRUntime<O>
    type ex1Rtype = RuntimeType["example1"]
    type T = Exclude<ex1Rtype, undefined>["options"][number]

    const ex1: T = "test"
    const ex1_2: T = "abc"
    // @ts-expect-error
    const ex1_3: T = "collection"

    type ex2Rtype = Exclude<RuntimeType["example2"], undefined>

    const ex2: ex2Rtype["options"][number] = "collection"
    const ex2_2: ex2Rtype["options"][number] = "view-input"
    const ex2_3: ex2Rtype["options"][number] = "view-output"
    // @ts-expect-error
    const ex2_4: ex2Rtype["options"][number] = "asdasd"

    type ex3Rtype = Exclude<RuntimeType["example3"], undefined>

    const ex3: ex3Rtype["options"][number] = "collection"
    const ex3_2: ex3Rtype["options"][number] = "view-input"
    const ex3_3: ex3Rtype["options"][number] = "view-output"
    const ex3_4: ex3Rtype["options"][number] = "asdasd"



    updateRuntimeParameter(node, "ex4", {
      type: "number",
      title: `title`,
      order: 1,
      hideWithoutValue: true,

      invalidates: ["example1",]
    })
    updateRuntimeParameter(node, "ex4", {
      type: "number",
      title: `title`,
      order: 1,
      hideWithoutValue: true,
      // @ts-expect-error
      invalidates: ["asds",]
    })
  },
  process(node, data, callbacks) {


  },
})

