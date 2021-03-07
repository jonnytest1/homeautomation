export interface Audio {
    killed: boolean
    kill(): void
}


export interface AudioPlayer {
    play(executable: string, options: AudioPlayOptions, callback: (response) => void): Audio
}

export interface AudioPlayOptions {
    [executable: string]: Array<string>
}