
import { spawn } from "child_process"
import { join } from 'path'
import { MINUTE, root } from '../constant'
import { app, screen } from "electron"
import { logKibana } from '../util/log'

const scriptDir = join(root, "services", "window-utils")


interface WindowData {
  position: {

    Bottom: number
    Left: number
    Right: number
    Top: number
  }
  title: string
  windowRef: number
  process: {

  }
  state: "Normal" | "Minimized" | "Maximized"
}


interface HistoryEntry {
  timestamp: number
  windowData: Array<WindowData>
  screens: Electron.Display[]
}

export class WindowService {


  static readonly powerShellExe = "powershell.exe"

  static readonly

  history: Array<HistoryEntry> = []


  screenMap: Record<string, HistoryEntry> = {}



  constructor() {

  }
  async start() {
    await app.whenReady()

    this.windowLoop()

    screen.addListener("display-removed", () => {
      const ts = Date.now()

      while (this.history.length && this.history.at(-1)!.timestamp > (ts - (0.5 * MINUTE))) {
        this.history.pop()
      }
      const latestEntry = this.history.at(-1)

      if (latestEntry) {
        const screenHash = latestEntry.screens
          .map(s => s.id)
          .sort((a, b) => a - b)
          .join(">")

        this.screenMap[screenHash] = latestEntry
        console.log("stored window data ", screenHash)
      } else {
        console.error("no window entry remaining")
      }


    })

    screen.addListener("display-added", () => {

      setTimeout(async () => {
        const screens = await screen.getAllDisplays()
        const currentScreenHash = screens
          .map(s => s.id)
          .sort((a, b) => a - b)
          .join(">")

        if (this.screenMap[currentScreenHash]) {
          console.log("found matching screen data")
          this.restoreWindows(this.screenMap[currentScreenHash])
        } else {
          console.error(`no matching screen found `, currentScreenHash, Object.keys(this.screenMap))
        }
      }, 500)
    })
  }

  async restoreWindows(data: HistoryEntry) {
    const windowList = await this.getWindows()

    for (const currentWindow of windowList) {

      for (const historyWindow of data.windowData) {

        if (historyWindow.windowRef === currentWindow.windowRef) {
          const height = historyWindow.position.Bottom - historyWindow.position.Top
          const width = historyWindow.position.Right - historyWindow.position.Left

          if (historyWindow.position.Left !== currentWindow.position.Left
            || historyWindow.position.Right !== currentWindow.position.Right
            || historyWindow.position.Top !== currentWindow.position.Top
            || historyWindow.position.Bottom !== currentWindow.position.Bottom
            || historyWindow.state !== currentWindow.state) {

            console.log(`restoring window ${currentWindow.title}`)

            this.updateWindow(currentWindow.windowRef, {
              x: historyWindow.position.Left,
              y: historyWindow.position.Top,
            }, {
              x: width,
              y: height
            }, historyWindow.state === "Maximized" ? "maximize" : "normal")

          }
          break;
        }
      }
    }


  }


  async windowLoop() {
    while (true) {
      try {
        const [screens, windows] = await Promise.all([
          screen.getAllDisplays(),
          this.getWindows()
        ])
        this.history.push({
          timestamp: Date.now(),
          windowData: windows.filter(w => w.state !== "Minimized"),
          screens: screens
        })
        while (this.history.length > 10) {
          this.history.shift()
        }
        await new Promise(res => setTimeout(res, 500))
      } catch (e) {

      }
    }
  }

  runScript(script: string, ...args: Array<string>) {
    return new Promise<string>((res, err) => {
      const pr = spawn(WindowService.powerShellExe, [join(scriptDir, script), ...args], {

      })

      let exitCode = -1
      let buffer = ""
      pr.stdout?.on("data", d => {
        buffer += d.toString()
      })
      pr.stdout?.on("close", d => {

        res(buffer)
      })
      pr.stderr.on("data", d => {
        console.error(d)
        err(d.toString())
      })

      pr.on("exit", c => {
        if (c != null) {
          exitCode = c
        }

      })
    })
  }

  async getWindows() {
    let resp = await this.runScript("windows-list.ps1")
    if (resp.includes("----debug-finished----")) {
      resp = resp.split("----debug-finished----")[1].trim()
    }
    try {
      const controlEscaped = resp.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, c => {
        return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')
      })
      return JSON.parse(controlEscaped) as Array<WindowData>
    } catch (e) {
      logKibana("ERROR", {
        message: "error getting windows",
        resp
      }, e)
      throw e
    }

  }


  updateWindow(windowRef: number, pos: { x: number, y: number }, dim: { x: number, y: number }, state: "maximize" | "minimize" | "normal") {
    return this.runScript("window-update.ps1", `${windowRef}`, `${pos.x}`, `${pos.y}`, `${dim.x}`, `${dim.y}`, state)
  }
}