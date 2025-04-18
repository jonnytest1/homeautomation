import { serviceFolder } from './generic-node-constants'
import { logKibana } from '../../util/log'
import { watch } from 'chokidar'
import { join, dirname } from "path"

let loadingFile: string | undefined = undefined
export function getLaodingFile() {
  return loadingFile
}
export function startHotRelaodingWatcher() {
  return new Promise<void>(res => {
    watch(serviceFolder, {})
      .on("add", e => {
        if (e.endsWith(".ts") && !e.endsWith("d.ts")) {
          loadingFile = e
          require(e)
          loadingFile = undefined
        }
      })
      .on("change", path => {
        try {
          reload(path)
        } catch (e) {
          logKibana("ERROR", {
            message: "Error during hot reload",
          }, e)
        }
      }).on("ready", () => {

        setTimeout(() => {
          res()
        })

      })
  })

}

function reload(path: string) {
  if (path.endsWith(".ts") && !path.endsWith("d.ts")) {
    if (path in require.cache) {
      delete require.cache[path]
    }
    try {
      loadingFile = path
      require(path)
      loadingFile = undefined
    } catch (e) {
      if ("diagnosticText" in e) {
        const diagnostic = e.diagnosticText
        if (typeof diagnostic === "string") {
          // eslint-disable-next-line no-control-regex
          const wihoutAnsi = diagnostic.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
          let match = wihoutAnsi.match(/^(?<path>.*?)(?<linenr>\(\d+,\d+\)): error TS2305: Module '"(?<moduleRef>.*?)"' has no exported member/)
          if (!match?.groups) {
            match = wihoutAnsi.match(/^(?<path>.*?)(?<linenr>\(\d+,\d+\)): error TS2724: '"(?<moduleRef>.*?)"' has no exported member/)
          }
          if (!match?.groups) {
            match = wihoutAnsi.match(/^(?<path>.*?)(?<linenr>\d+:\d+) - error TS2305: Module '"(?<moduleRef>.*?)"' has no exported member/)
          }
          if (match?.groups) {
            console.warn("matched for " + match.groups.moduleRef)
            let missingExportFile = join(dirname(path), match.groups.moduleRef)

            if (!require.cache[missingExportFile] && require.cache[missingExportFile + ".ts"]) {
              missingExportFile = missingExportFile + ".ts"
            }
            const moduleRef = require.cache[missingExportFile]
            if (!moduleRef?.exports["withSideEffects"]) {
              logKibana("WARN", {
                message: "hot relaoding module",
                module: missingExportFile,
                path
              })
              reload(missingExportFile)
              reload(path)
              return
            }

          }
        }
      }
      throw e;
    }
    console.log("successfully loaded " + path)
  }
}

