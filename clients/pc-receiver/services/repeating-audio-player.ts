import { spawn, ChildProcessWithoutNullStreams } from "child_process"

export class RepeatingAudio {

    private static readonly vlcExe = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe'

    public static readonly prefixPath = 'D:\\Jonathan\\Projects\\node\\homeautomation\\clients\\pc-receiver\\services\\sounds\\'

    private startArguments = []

    audioHandle: ChildProcessWithoutNullStreams;

    stopped = false
    constructor(audio: string, volume?: number | string) {
        if (audio.match(/[^a-zA-Z0-9]/g)) {
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