
import say from "say"
import type { TransformationRes } from "../../../server/src/models/connection-response"
import { join } from "path"
import { mkdir } from "fs/promises"
import { spawn } from "child_process"
type GetVoicesFnc = (cb: (err, voices: Array<string>) => void) => void;

const voices = new Promise<Array<string>>(res => {
  (say.getInstalledVoices as GetVoicesFnc)((e, voices) => {
    res(voices)
  })
})


const file_folder = join(__dirname, "speech_files")
const vlcExe = join("C:\\Program Files\\VideoLAN\\VLC", "vlc.exe")

export class TextReader {

  static speech_files: Record<string, string> = {}


  speechPromise: Promise<void>

  sanitized_text: string

  constructor(private data: TransformationRes["read"]) {
    this.sanitized_text = this.data!.text
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/[^a-zA-Z 0-9]/g, '')
      .trim();


    this.speechPromise = this.generate_sound()
  }

  async generate_sound() {
    if (TextReader.speech_files[this.sanitized_text]) {
      return
    }
    const file_speech = encodeURIComponent(this.sanitized_text);
    TextReader.speech_files[this.sanitized_text] = join(file_folder, file_speech + ".wav")
    await mkdir(file_folder, { recursive: true })
    const voice = await this.getVoice()
    return new Promise<void>((res, err) => {

      say.export(this.sanitized_text, voice, undefined, TextReader.speech_files[this.sanitized_text], (e) => {
        if (e) {
          err(e)
        }
        res()
      })
    })
  }

  async getVoice() {
    const voiceList = await voices;
    return voiceList.filter(v => v.toLowerCase().includes("zira"))[0]
  }

  async read(abort?: AbortSignal) {
    /**
     *  await this.speechPromise
    return new Promise(res => {
      const pr = spawn(`${vlcExe}`, ["--intf", "dummy", TextReader.speech_files[this.sanitized_text]], {

      })
      pr.addListener("exit", code => {
        debugger
      })
      pr.addListener("close", code => {
        debugger
      })
      pr.addListener("message", code => {
        debugger
      })
    })

     */
    const voice = await this.getVoice()
    abort?.addEventListener("abort", () => {
      say.stop()
    })

    return new Promise<void>(res => {

      say.speak(this.sanitized_text, voice, undefined, (e) => {
        //debugger
        res();
      });
    })

  }
}



