export type RecursiveCallTrace = {
  [connid: `Connection:${string}`]: {
    [typeanduuid: `Node:${string}`]: RecursiveCallTrace,

  },
  [typeanduuid: `type:${string}`]: RecursiveCallTrace
}
export type CallTrace = {
  nodes: Array<string>,
  callTrace: RecursiveCallTrace,
  callTraceRoot: RecursiveCallTrace,
  initContext: string,
  logIt: boolean
}