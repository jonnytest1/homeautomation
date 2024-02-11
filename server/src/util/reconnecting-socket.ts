
import { client as WebSocket, Message, connection, IClientConfig } from 'websocket';
import type { OutgoingHttpHeaders, RequestOptions } from 'http';
import type { Url } from 'url';


export class ReconnectingSocket extends WebSocket {


  private messageCbs: Array<(m: Message) => void> = []

  private currentConenction?: connection

  private connectCallback?: () => void


  url?: URL
  headers
  opts


  public closed = false

  constructor(ClientConfig?: IClientConfig | undefined) {
    super(ClientConfig);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.on("connect", connection => {
      console.log("connected", self.url?.href)
      this.currentConenction = connection

      connection.on("message", message => {
        this.messageCbs.forEach(mcB => {
          mcB(message)
        })
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      connection.on("close", e => {
        console.log("closed", self.url?.href)
        connection.removeAllListeners()
        if (self.url && !this.closed) {
          console.log("reconnecting ...", self.url?.href)
          self.connect(self.url.href, undefined, undefined, this.headers, this.opts)
        }
      })

      connection.on("error", (e) => {
        console.log("error", e, self.url?.href)
      })

      this.connectCallback?.()
    })

    this.on("connectFailed", () => {
      console.log("connectFailed")
      setTimeout(() => {
        if (self.url) {
          console.log("reconnecting ...")
          self.connect(self.url.href, undefined, undefined, this.headers, this.opts)
        }
      }, 1000)
    })

  }

  connect(requestUrl: string | Url, requestedProtocols?: string | string[] | undefined, origin?: string | undefined, headers?: OutgoingHttpHeaders | undefined, extraRequestOptions?: RequestOptions | undefined): void {
    if (!this.url && typeof requestUrl == "string") {
      this.url = new URL(requestUrl)
      console.log("set url for " + this.url.href)
    }
    this.headers = headers
    this.opts = extraRequestOptions
    super.connect(requestUrl, requestedProtocols, origin, headers, extraRequestOptions)
    if (!this.url && typeof requestUrl == "string") {
      this.url = new URL(requestUrl)
      console.log("set url for " + this.url.href)
    }
  }

  onconnect(cb: () => void) {
    this.connectCallback = cb;
  }

  onmessage(cb: (m: Message) => void) {
    this.messageCbs.push(cb)
  }


  send(message: string) {
    this.currentConenction?.send(message)
  }

  close() {
    this.closed = true
    this.currentConenction?.close()
  }

}