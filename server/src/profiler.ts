import { environment } from './environment'
import { logKibana } from './util/log'
import { ResolvablePromise } from './util/resolvable-promise'
import { existsSync, createWriteStream } from "fs"
import { mkdir, rename } from "fs/promises"
import { join } from 'path'
import { getHeapSnapshot, getHeapStatistics } from "v8"
import inspector from 'node:inspector';
import { writeFileSync } from 'node:fs'

const start = `profile_${encodeURIComponent(new Date().toISOString())}`
let ct = 0

function toMb(bytes: number) {
  return bytes / 1024 / 1024
}
function formatBytes(bytes) {
  return `${(toMb(bytes)).toFixed(2)} MB`;
}

async function snapshot() {
  heapSnapshot();
  cpuSnapshot()
}
async function cpuSnapshot() {


  const session = new inspector.Session();

  session.connect();

  session.post('Profiler.enable', async () => {
    session.post('Profiler.start');


    const cpuReadings: Array<number> = [];



    for (let i = 0; i < 25; i++) {

      const cpuUsageStart = process.cpuUsage();
      const startTime = process.hrtime.bigint();

      await ResolvablePromise.delayed(1000)
      const cpuDiff = process.cpuUsage(cpuUsageStart);
      console.log('Cpu system:', cpuDiff.system);
      console.log('Cpu user:', cpuDiff.user);

      const elapsedMs =
        Number(process.hrtime.bigint() - startTime) / 1e6;


      const processTime = cpuDiff.system + cpuDiff.user
      const cpuMs = (processTime) / 1000;
      const cpuPct = (cpuMs / elapsedMs) * 100;

      cpuReadings.push(cpuPct)
    }
    const avg = cpuReadings.reduce((a, b) => a + b, 0) / cpuReadings.length;
    console.log("average cpu %", avg)


    session.post('Profiler.stop', async (err, { profile }) => {
      if (err) {
        logKibana("ERROR", "error profiling cpu", err)
      }
      logKibana("INFO", { message: "cpu stats", averagePercent: avg, cpuReadings })

      if (avg < 120) {
        return
      }

      const folder = environment.PROFILE_FOLDER ?? "/var/profiler"

      if (!existsSync(folder)) {
        await mkdir(folder, { recursive: true })
      }
      const filename = `${start}_${ct++}.cpuprofile`
      const file = join(folder, filename)
      writeFileSync(file, JSON.stringify(profile));
      session.disconnect();
      console.log('CPU profile written');
    });


  });
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


  if (toMb(memoryUsage.rss) < 18000) {
    return
  }
  console.log("snapshotting")


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
    logKibana("ERROR", {
      message: "finished snapshot",
      ...memoryUsage,
      ...heapStats
    })
  });

}

if (environment.PROFILER_ENABLED) {
  setInterval(snapshot, 1000 * 60 * 5);
  setTimeout(snapshot, 1000 * 60)
}