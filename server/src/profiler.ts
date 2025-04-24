import { environment } from './environment'
import { logKibana } from './util/log'
import { Session } from "inspector"
import { closeSync, existsSync, openSync, writeSync } from "fs"
import { mkdir, rename } from "fs/promises"
import { join } from 'path'


async function heapSnapshot() {

  console.log("snapshotting")

  const session = new Session()

  session.connect()

  const folder = environment.PROFILE_FOLDER ?? "/var/profiler"

  if (!existsSync(folder)) {
    await mkdir(folder, { recursive: true })
  }
  const filename = `profile_${encodeURIComponent(new Date().toISOString())}.heapsnapshot`
  const file = join(folder, filename)


  const fd = openSync(file, "w")

  session.addListener("HeapProfiler.addHeapSnapshotChunk", m => {
    writeSync(fd, m.params.chunk)
  })
  session.post("HeapProfiler.takeHeapSnapshot", undefined, (err) => {
    if (err) {
      logKibana("ERROR", "failed taking snapshot", err)
    }
    session.disconnect()
    console.log("snapshot " + file + " done")
    closeSync(fd)
    rename(file, join(folder, filename + ".done"))

  })


}

if (environment.PROFILER_ENABLED) {
  setInterval(heapSnapshot, 1000 * 60 * 60 * 1);
  setTimeout(heapSnapshot, 1000 * 60)
}