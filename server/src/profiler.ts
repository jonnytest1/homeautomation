import { environment } from './environment'
import { existsSync, createWriteStream } from "fs"
import { mkdir, rename } from "fs/promises"
import { join } from 'path'
import { getHeapSnapshot, getHeapStatistics } from "v8"


const start = `profile_${encodeURIComponent(new Date().toISOString())}`
let ct = 0

function toMb(bytes: number) {
  return bytes / 1024 / 1024
}
function formatBytes(bytes) {
  return `${(toMb(bytes)).toFixed(2)} MB`;
}


async function heapSnapshot() {

  const memoryUsage = process.memoryUsage();
  console.log('Heap Used:', formatBytes(memoryUsage.heapUsed));
  console.log('Heap Total:', formatBytes(memoryUsage.heapTotal));
  console.log('RSS (Resident Set Size):', formatBytes(memoryUsage.rss)); console.log('Heap Used:', formatBytes(memoryUsage.heapUsed));
  console.log('Heap Total:', formatBytes(memoryUsage.heapTotal));
  console.log('RSS (Resident Set Size):', formatBytes(memoryUsage.rss));

  const heapStats = getHeapStatistics();
  console.log('Total Available Size:', formatBytes(heapStats.total_available_size));
  console.log('Total Heap Size:', formatBytes(heapStats.total_heap_size));
  console.log('Used Heap Size:', formatBytes(heapStats.used_heap_size));

  console.log("snapshotting")

  if (toMb(heapStats.used_heap_size) < 18000) {
    return
  }


  const folder = environment.PROFILE_FOLDER ?? "/var/profiler"

  if (!existsSync(folder)) {
    await mkdir(folder, { recursive: true })
  }
  const filename = `${start}_${ct++}.heapsnapshot`
  const file = join(folder, filename)


  const pendingFile = join(folder, filename + ".pending")
  const snapshotStream = getHeapSnapshot();
  const fileStream = createWriteStream(pendingFile);
  snapshotStream.pipe(fileStream);

  fileStream.on('finish', async () => {
    console.log("snapshot " + file + " done")
    rename(pendingFile, file)
  });

}

if (environment.PROFILER_ENABLED) {
  setInterval(heapSnapshot, 1000 * 60);
  setTimeout(heapSnapshot, 1000 * 60)
}