
import { createServer } from "net"

export class SocketService {
    constructor(port: number) {
        const s = createServer((socket) => {
            console.log("connected");

            let d = ""

            socket.on("data", data => {
                let last;
                for (const char of data.toString()) {

                    if (char == "\n" && last == "\n") {
                        console.log(d);
                        setTimeout(() => {
                            socket.write("return\n\n", (err) => {
                                if (err) {
                                    debugger
                                }
                            })
                        }, 2000);
                        d = ""
                        continue;
                    }
                    last = char;
                    d += char;
                }



            })
            //192.168.178.34
        });
        const listening = s.listen(port, () => {
            console.log("listening")
        });
    }
}