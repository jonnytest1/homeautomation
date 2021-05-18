import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import { log } from './log';

export class UrlService {


    process: ChildProcessWithoutNullStreams;
    async open() {
        try {
            const response = await this.command(process.env.CHROME_EXE, [this.url])
        } catch (err) {
            log("ERROR", err.message);
        }

    }

    async command(command: string, args?: readonly string[]): Promise<string> {
        return new Promise((resolve, errorCb) => {
            const childProcess = spawn(command, args)
            let stdin = "";
            let stderr = '';

            childProcess.stdout.on("data", data => {
                stdin += data + '\n';
            });

            childProcess.stderr.on("data", data => {
                stderr += data + '\n';
            });
            childProcess.on("error", error => {
                errorCb(error)
            })

            childProcess.on("close", code => {
                if (code !== 0 || stderr.length) {
                    errorCb(stderr)
                } else {
                    resolve(stdin);
                }
            })
        })


    }



    constructor(private url: string) { }
}