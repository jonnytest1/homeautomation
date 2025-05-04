



let abortTs = -1
let currentAbort: Abortable | undefined
export function abort() {
  abortTs = Date.now()
  currentAbort?.abortController?.abort("abort event")
}

interface AbortOpts {
  onAbort?: () => (void | Promise<void>)

  // runs on abort whith abortDisabled
  onAbortAttempt?: () => (void | Promise<void>)

  abortDisabled?: boolean
}



export type AbortRef = (abortRef: AbortSignal) => Promise<unknown>


class Aborted extends Error {

}



export class Abortable {


  abortController?: AbortController
  start: number

  constructor(private calls: Array<AbortRef>) {
    currentAbort = this;
  }


  async run(opts: AbortOpts = {}) {
    this.start = Date.now()
    let doneAbortAttempt = false

    let wasAborted = false
    for (const call of this.calls) {
      this.abortController = new AbortController()

      this.abortController.signal.addEventListener("abort", async () => {
        if (opts.abortDisabled) {
          if (!doneAbortAttempt) {
            await opts.onAbortAttempt?.()
            doneAbortAttempt = true
          }
        } else {
          wasAborted = true
          console.log(`calling abort`)
          await opts.onAbort?.()
          return
        }
      })
      try {
        await call(this.abortController.signal);
        if (wasAborted) {
          return
        }
      } catch (e) {
        if (e instanceof Aborted) {
          return
        }
        throw e;
      }
    }
    currentAbort = undefined;
  }

  static wait(delaySeconds: number): AbortRef {
    return (aborter) => {
      return new Promise((res, err) => {

        const timeout = setTimeout(res, 1000 * delaySeconds)
        aborter.addEventListener("abort", () => {
          err(new Aborted(""))
        })
      })
    }
  }

}




export async function abortable(calls: Array<AbortRef>, opts: AbortOpts = {}) {
  return new Abortable(calls).run(opts);
}