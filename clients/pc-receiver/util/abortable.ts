



let abortTs = -1
export function setLastAbort() {
  abortTs = Date.now()
}

interface AbortOpts {
  onAbort?: () => (void | Promise<void>)

  abortDisabled?: boolean
}


export async function abortable(calls: Array<() => Promise<unknown>>, opts: AbortOpts = {}) {
  const start = Date.now()

  for (const call of calls) {
    await call();
    if (abortTs > start && !opts.abortDisabled) {
      console.log(`calling abort`)
      await opts.onAbort?.()
      return
    }
  }
}