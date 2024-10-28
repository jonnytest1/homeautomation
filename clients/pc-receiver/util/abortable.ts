



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
  let doneAbortAttempt = false
  for (const call of calls) {
    await call();
    if (abortTs > start) {
      if (opts.abortDisabled) {
        if (!doneAbortAttempt) {
          await opts.onAbortAttempt?.()
          doneAbortAttempt = true
        }
      } else {
        console.log(`calling abort`)
        await opts.onAbort?.()
        return
      }

    }
  }
}