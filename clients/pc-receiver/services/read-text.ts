
import { speak } from "say"
import { TransformationRes } from "../../../server/src/models/connection-response"
export class TextReader {

    constructor(private data: TransformationRes["read"]) { }

    read() {
        const sanitized = this.data.text
            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
            .replace(/[^a-zA-Z 0-9]/g, '')
        console.log(new Date().toLocaleString(), `reading ${sanitized}`)
        speak(sanitized);
    }
}
