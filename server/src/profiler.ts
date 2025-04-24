import { environment } from './environment'
import { logKibana } from './util/log'
import { Session } from "inspector"
import { closeSync, existsSync, openSync, writeSync } from "fs"
import { mkdir } from "fs/promises"
import { join } from 'path'


async function heapSnapshot() {


  const session = new Session()

  session.connect()

  const folder = environment.PROFILE_FOLDER ?? "/var/profiler"

  if (!existsSync(folder)) {
    await mkdir(folder, { recursive: true })
  }
  const file = join(folder, `profile_${encodeURIComponent(new Date().toISOString())}.heapsnapshot`)


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
  })


}

if (environment.PROFILER_ENABLED) {
  setInterval(heapSnapshot, 1000 * 60 * 60 * 1);
  heapSnapshot();
}