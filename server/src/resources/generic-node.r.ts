import { serviceFolder } from '../services/generic-node/generic-node-constants';
import { typeImplementations } from '../services/generic-node/type-implementations';
import { GET, Path, type HttpRequest, type HttpResponse } from 'express-hibernate-wrapper';
import { JSDOM } from "jsdom"
import { relative, dirname, join, resolve } from 'path';
import { readFile } from 'fs/promises';

@Path('generic-node')
export class GenericNodeResources {



  @GET("frame/:type/:page")
  async getFrame(req: HttpRequest, res: HttpResponse) {

    const typeImpl = typeImplementations.value[req.params.type]
    if (!typeImpl?._file) {
      return res.status(404).send("no type impl")
    }
    const typeFolder = dirname(typeImpl._file)
    const relativeToServicesFodler = relative(serviceFolder, typeFolder)
    if (!relativeToServicesFodler.length) {
      return res.status(400).send("frame onyl allowed with subfolder")
    }
    const pageFile = resolve(join(typeFolder, req.params.page))
    if (!pageFile.includes(typeFolder)) {
      return res.status(500).send()
    }

    let content = await readFile(pageFile, { encoding: "utf8" })
    let contentType = "text/html"
    if (req.params.page.endsWith(".html")) {
      const dom = new JSDOM(content)
      const scriptEl = dom.window.document.createElement("script")
      scriptEl.textContent = `
        var eventMap={}


        addEventListener("message", m => {
          const evt = JSON.parse(m.data)
          if(evt.type==="response"){
            eventMap[evt.messageId]?.(evt.data);
            delete eventMap[evt.messageId];
          }
        })
        
        function sendToNodeImplementation(event){
            return new Promise(res=>{
              const messageId=\`\${Math.random()}\`
              eventMap[messageId]=res
              event.messageId=messageId
              window.parent.postMessage(JSON.stringify(event), "*")
            })
        }
    
    `
      dom.window.document.body.prepend(scriptEl)
      content = dom.serialize()

    } else if (req.params.page.endsWith(".js")) {
      contentType = "application/javascript"
    }
    res.header("Content-Type", contentType).send(content)
  }

}