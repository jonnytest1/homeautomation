import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import { existsSync } from "fs"
export class RepeatingAudio {

  public static readonly invalidSoundStringREgex = /[^a-zA-Z0-9-_]/g

  private static readonly vlcExe = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe'

  public static readonly prefixPath = 'D:\\Jonathan\\Projects\\node\\homeautomation\\clients\\pc-receiver\\services\\sounds\\'

  private startArguments: Array<string> = []

  audioHandle: ChildProcessWithoutNullStreams;

  stopped = false
  constructor(audio: string, volume?: number | string) {
    if (audio.match(RepeatingAudio.invalidSoundStringREgex)) {
      console.error("invalid sound string");
      return;
    }
    this.startArguments = ['--intf', 'dummy', '--no-loop', '--play-and-exit'];
    if (volume) {
      this.startArguments.push(`--mmdevice-volume=0.1`);
      this.startArguments.push(`--directx-volume=0.1`);
      this.startArguments.push(`--waveout-volume=0.1`);
      this.startArguments.push(`--volume=10`);
    }
    this.startAudio(audio);
  }


  public static check() {
    if (!existsSync(this.vlcExe)) {
      throw new Error("missing vlc")
    }
  }


  private startAudio(audio: string) {
    this.audioHandle = spawn(RepeatingAudio.vlcExe, [`${RepeatingAudio.prefixPath}\\${audio}`, ...this.startArguments], {});
    this.audioHandle.on("exit", (code, signal) => {
      this.audioHandle.kill();
      if (!this.stopped && signal !== "SIGTERM") {
        this.startAudio(audio)
      }
    });
  }

  stop() {
    this.stopped = true
    this.audioHandle.kill()
  }
}