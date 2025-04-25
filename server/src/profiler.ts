import { environment } from './environment'
import { logKibana } from './util/log'
import { Session } from "inspector"
import { existsSync } from "fs"
import { mkdir, rename, open } from "fs/promises"
import { join } from 'path'


const start = `profile_${encodeURIComponent(new Date().toISOString())}`
let ct = 0
async function heapSnapshot() {

  console.log("snapshotting")

  const session = new Session()

  session.connect()

  const folder = environment.PROFILE_FOLDER ?? "/var/profiler"

  if (!existsSync(folder)) {
    await mkdir(folder, { recursive: true })
  }
  const filename = `${start}_${ct++}.heapsnapshot`
  const file = join(folder, filename)


  const pendingFile = join(folder, filename + ".pending")
  const fd = await open(pendingFile, "w")

  session.addListener("HeapProfiler.addHeapSnapshotChunk", m => {
    fd.write(m.params.chunk)
  })
  session.post("HeapProfiler.takeHeapSnapshot", undefined, async (err) => {
    if (err) {
      logKibana("ERROR", "failed taking snapshot", err)
    }
    session.disconnect()
    console.log("snapshot " + file + " done")
    await fd.close()
    rename(pendingFile, file)

  })
}

if (environment.PROFILER_ENABLED) {
  setInterval(heapSnapshot, 1000 * 60 * 60 * 1);
  setTimeout(heapSnapshot, 1000 * 60)
}