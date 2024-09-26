import { readFile, readdir } from "fs/promises"
import { existsSync } from "fs"
import { join, dirname, resolve } from "path"
import { sha256 } from '../util/hash'
import { logKibana } from '../util/log'
const workspaceFile = "D:\\Jonathan\\visualstudio-workspaces\\smarthome.code-workspace"

async function getWorkspaceConfig() {
  const workspaceConfigStr = await readFile(workspaceFile, { encoding: "utf8" })
  const workspaceConfig = JSON.parse(workspaceConfigStr) as { folders: Array<{ name?: string, path: string }> };

  const isPlatformIo = Object.fromEntries(await Promise.all(workspaceConfig.folders.map(async folder => {

    let resolved = join(dirname(workspaceFile), folder.path);
    if (!folder.path.startsWith(".")) {
      resolved = resolve(folder.path);
    }

    const platformIniPath = join(resolved, "platformio.ini")
    return [resolved, existsSync(platformIniPath)] as const
  })))

  return Object.keys(isPlatformIo).filter(key => isPlatformIo[key]);
}

const platformIoProjercts = getWorkspaceConfig();


const fileLocSizeMAtch = /0x(?<stackI>[0-9a-f]*)\s*0x(?<size>[0-9a-f]*)\s*(?<path>.*)/
const lineMatch = /0x(?<stackI>[0-9a-f]*)\s*(?<content>.*)/
const resized = /0x(?<size>[0-9a-f]*)\s\(size before relaxing\)/


async function mapBacktrace(directory: string, backtrace: string) {
  const data = await readFile(join(directory, "firmware.map"), { encoding: "utf8" })

  const mapLines = data.split("Linker script and memory map")[1].split("Cross Reference Table")[0]

  const entries: Array<{ range: { address: number, size: number, file: string }, line }> = []

  let current: { size: number, address: number, file: string } | undefined = undefined
  for (const line of mapLines.split("\r\n")) {
    const trimmed = line.trim()
    const fileLocMatch = trimmed.match(fileLocSizeMAtch)
    if (fileLocMatch?.groups) {
      current = {
        address: parseInt("0x" + fileLocMatch?.groups.stackI),
        size: parseInt("0x" + fileLocMatch?.groups.size),
        file: fileLocMatch?.groups.path
      }
    } else {
      const fileLocMatch = trimmed.match(lineMatch)
      if (current && fileLocMatch?.groups && parseInt("0x" + fileLocMatch.groups.stackI) == current.address) {
        entries.push({
          range: current,
          line: fileLocMatch.groups.content
        })
        current = undefined
      } else {
        const resizeMatch = trimmed.match(resized)
        if (!current) {
          throw new Error("no current")
        }
        if (resizeMatch?.groups?.size) {
          current.size = parseInt("0x" + resizeMatch.groups.size)
        } else {
          current = undefined
        }
      }
    }
  }
  const revEntries = entries.reverse()

  const stackParts = backtrace.trim().split(" ");


  const mappedStack = stackParts.map(stack => {
    const loc = stack.split(":")[0]
    if (!loc) {
      return
    }
    const locI = parseInt(loc);



    for (const e of revEntries) {
      if (e.range.address < locI && e.range.address + e.range.size > locI) {
        if (e.range.file.includes("http_request")) {
          debugger;
        }
        return `${stack} at ${e.line} in ${e.range.file}`
      }
    }
    return null
  })
  return mappedStack.join("\n")
}

export async function traceTransform(message: string) {
  if (message.includes("Backtrace:") && message.includes("ELF file SHA256:")) {

    const sha = message.match(/ELF file SHA256: (?<sha256>[0-9a-f]*)/)
    if (!sha?.groups?.sha256) {
      return message
    }

    const firmwareShaBT = sha?.groups?.sha256;

    const backtraceM = message.match(/Backtrace: (?<backtrace>[0-9a-f :x]*)/)

    if (!backtraceM?.groups?.backtrace) {
      return message
    }
    const backtrace = backtraceM.groups.backtrace
    if (firmwareShaBT.length < 10) {
      return message;
    }
    if (backtrace.length < 10) {
      return message;
    }

    const projects = await platformIoProjercts;
    let foundSha = false;
    let matchedSha = false;

    await Promise.all(projects.map(async p => {
      const envDir = join(p, ".pio", "build")
      const envs = await readdir(envDir)

      for (const env of envs) {

        const envDirectory = join(envDir, env)
        if (!isNaN(+env)) {

          const subFolders = await readdir(envDirectory)
          for (const subFolder of subFolders) {
            const buildDir = join(envDirectory, subFolder)
            const firmwareFile = join(buildDir, "firmware.elf")
            if (existsSync(firmwareFile)) {
              foundSha = true;
              const firmware = await readFile(firmwareFile)
              const firmwareSha = sha256(firmware);
              if (firmwareSha.startsWith(firmwareShaBT)) {
                matchedSha = true;
                const mappedTrace = await mapBacktrace(buildDir, backtrace)

                message = message.replace(backtrace, `${backtrace}\n\n${mappedTrace}`)
                debugger
              }
            } else {
              console.log("doesnt exist for " + p);
            }
          }
        } else {
          const firmwareFile = join(envDirectory, "firmware.elf")
          if (existsSync(firmwareFile)) {
            foundSha = true;
            const firmware = await readFile(firmwareFile)
            const firmwareSha = sha256(firmware);
            if (firmwareSha.startsWith(firmwareShaBT)) {
              matchedSha = true;
              const mappedTrace = await mapBacktrace(envDirectory, backtrace)

              message = message.replace(backtrace, `${backtrace}\n\n${mappedTrace}`)
              debugger
            }
          } else {
            console.log("doesnt exist for " + p);
          }
        }

      }
    }))
    await logKibana("ERROR", { from: "water-supply", message: "ERROR from esp", log: message, matchedSha, foundSha })
  }
  return message
}