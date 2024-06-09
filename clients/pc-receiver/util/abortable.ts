



let abortTs = -1
export function setLastAbort() {
  abortTs = Date.now()
}
export async function abortable(calls: Array<() => Promise<unknown>>) {
  const start = Date.now()

  for (const call of calls) {
    await call();
    if (abortTs > start) {
      return
    }
  }
}