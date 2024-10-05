import { app, BrowserWindow, protocol } from "electron"
import { logKibana } from '../util/log'

let activeWindow: BrowserWindow | undefined = undefined
let windowShown = false


export const popupConfig = {
  name: "popup",
  asyncRetained: true,
  responses: ["dismissed", "timeout"],
  argument: [{
    name: "active",
    type: "boolean"
  } as const, {
    name: "title",
    type: "text"
  } as const, {
    name: "htmlcontent",
    type: "monaco",
    mode: "html"
  } as const, {
    name: "activesince",
    type: "number"
  } as const, {
    name: "dismissable",
    type: "boolean"
  } as const]
} satisfies import("../../../server/src/services/mqtt-tasmota").DeviceCommandConfig

type PopupCommandConfig = typeof popupConfig
type PopupArgs = PopupCommandConfig["argument"]

type PopupArgsObj = {
  [arg in PopupArgs[number]as arg["name"]]: arg
}

type PopupARgsConfig = import("../../../server/src/services/generic-node/typing/node-options").NodeDefToType<PopupArgsObj> & {
  popupStartTime?: number
}

/*
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
])
*/

let onForm: (url: string) => void = () => { };
let onStartLoad: () => void = () => { };


export async function popup(data: string, callback: { response: (resp: { ts: number }) => void; overwrite: (payload: any) => void }) {

  const popupCfg = JSON.parse(data) as PopupARgsConfig

  await app.whenReady()

  if (!popupCfg.active) {
    if (windowShown) {
      logKibana("INFO", "closing previous window after close command")
    }

    activeWindow?.hide()
    activeWindow?.webContents.executeJavaScript(`window.stopped=true;`);
    activeWindow?.webContents.forcefullyCrashRenderer()
    activeWindow = undefined
    windowShown = false
    return
  }


  if (!activeWindow) {
    activeWindow = new BrowserWindow({
      title: popupCfg.title,
      width: 200,
      height: 100,
      show: false,
      movable: true,
      x: 1760,
      y: 900,
      alwaysOnTop: true,
      frame: false,

    })

    activeWindow.webContents.on("did-finish-load", () => {
      activeWindow?.show()
      windowShown = true
    })

    activeWindow.webContents.session.protocol.registerStringProtocol("form", e => {
      onForm?.(e.url)
    })

    activeWindow.webContents.on("did-start-loading", () => {
      onStartLoad?.()
    })
    /* activeWindow.webContents.session.protocol.handle("app", (e) => {
 
       if (e.url === "app://rendered/") {
         activeWindow.show()
       }
       return new Response("", {
         status: 200,
         headers: { 'content-type': 'text/html' }
       })
     })*/
  }
  popupCfg.popupStartTime = Date.now()
  let actionRow = `

  <input type="hidden" name="formts" value="${popupCfg.popupStartTime}">
  <button type="submit" name="response" value="dismissed" ${popupCfg.dismissable ? "" : "hidden"}>dismiss</button>
    <button type="submit" name="response" value="timeout" hidden>timeout</button>`



  //activeWindow.webContents.openDevTools()
  const html = `
      <form action="form://submit" id="mainform">

        <script>
         
        </script>

        ${popupCfg.htmlcontent}

        ${actionRow}
      </form>
  
  `
  /**
   *     <script>
          fetch("app://rendered");
          // ${Date.now()}
      </script>
   */
  onStartLoad = () => {
    activeWindow?.webContents.executeJavaScript(`window.popupConfig=${JSON.stringify(popupCfg)};`)
  }
  onForm = url => {
    const request = new URL(url)
    const data = Object.fromEntries(request.searchParams.entries()) as {
      response: "timeout" | "dismissed",
      formts: string
      [k: string]: string;
    }// {timeout:"true"}

    if (+data.ts !== popupCfg.popupStartTime) {
      debugger
      return
    }


    callback.response({
      ts: popupCfg["timestamp"],
      ...data
    })
    callback.overwrite({
      ...popupCfg,
      response: data.response,
      active: false
    })


    activeWindow?.hide()
    activeWindow = undefined
  }

  logKibana("INFO", {
    message: "starting popup",
    cfg: JSON.stringify(popupCfg)
  })
  await activeWindow.loadURL(`data:text/html;base64,${Buffer.from(html).toString("base64")}`)


  //



}