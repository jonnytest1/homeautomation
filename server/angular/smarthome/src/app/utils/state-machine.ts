
type StringTypes<T extends string> = {
  [K in T]: K extends string ? K : never
}[T]


type StateMachine<T extends string> = {
  [K in StringTypes<T> as `is${K}`]: boolean
} &
  {
    [K in StringTypes<T> as `set${K}`]: () => void
  }

export function createStateMachine<T extends ReadonlyArray<string>, U extends T[number]>(...states: T): StateMachine<T[number]>
export function createStateMachine<T extends ReadonlyArray<string>, U extends T[number]>(config?: { initial?: U }, ...states: T): StateMachine<T[number]> {

  const options = [...states] as Array<T[number]>;
  let initial: string;
  if (typeof config == "string") {
    options.unshift(config)
    initial = config;
  } else if (config.initial) {
    initial = config.initial;
  }
  let current = initial;


  const state = {

  } as StateMachine<T[number]>
  for (const option of options) {
    Object.defineProperty(state, `is${option}`, {
      get: () => current == option
    })
    Object.defineProperty(state, `set${option}`, {
      value: () => {
        console.log("new state: " + option)
        return current = option;
      }
    })
  }
  return state
}