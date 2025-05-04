import { WindowService } from './window-service'

describe("window service", () => {


  it("ping", async () => {
    jest.setTimeout(999999)
    const ws = new WindowService()

    const windows = await ws.getWindows()

    const wnd = windows.find(w => w.title.includes("ChatGPT"))
    if (!wnd) {
      throw new Error("couldnt match window")
    }
    await ws.updateWindow(wnd?.windowRef, {
      x: -1928,
      y: -8
    }, {
      x: 1920,
      y: 1024
    }, "maximize")
    debugger
  })

  it("test script", async () => {
    jest.setTimeout(999999)
    const ws = new WindowService()

    let resp = await ws.runScript("windows-list.ps1")

    if (resp.includes("----debug-finished----")) {
      resp = resp.split("----debug-finished----")[1].trim()
    }
    debugger;
  })
})