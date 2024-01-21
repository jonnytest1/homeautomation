import { Subject } from 'rxjs'


export class ReconnectingWebsocket {

  socket: WebSocket


  messages$ = new Subject<string>()

  closed = false


  constructor(private url: string) {
    this.createSocekt()

    const interval = setInterval(() => {
      if (this.closed) {
        clearInterval(interval)
      }
      this.socket.send(JSON.stringify({ type: "ping" }))

    }, 20000)


  }


  createSocekt() {
    this.socket = new WebSocket(this.url)
    this.socket.addEventListener("close", () => {
      if (!this.closed)
        this.createSocekt()
    })

    this.socket.onmessage = (e) => {
      this.messages$.next(e.data)
    };



  }
  close() {
    this.closed = true
    this.socket.close()
  }
}