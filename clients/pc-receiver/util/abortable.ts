



let abortTs = -1
export function setLastAbort() {
  abortTs = Date.now()
}

interface AbortOpts {
  onAbort?: () => (void | Promise<void>)

  // runs on abort whith abortDisabled
  onAbortAttempt?: () => (void | Promise<void>)

  abortDisabled?: boolean
}


export async function abortable(calls: Array<() => Promise<unknown>>, opts: AbortOpts = {}) {
  const start = Date.now()

  for (const call of calls) {
    await call();
    if (abortTs > start) {
      if (opts.abortDisabled) {
        await opts.onAbortAttempt?.()
      } else {
        console.log(`calling abort`)
        await opts.onAbort?.()
        return
      }

    }
  }
}