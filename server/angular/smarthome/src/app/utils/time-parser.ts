export class TimerParser {
    static msToTime(duration: number) {
        const seconds = Math.floor((duration / 1000) % 60);
        const minutes = Math.floor((duration / (1000 * 60)) % 60);
        const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        const strhours = (hours < 10) ? '0' + hours : hours;
        const strminutes = (minutes < 10) ? '0' + minutes : minutes;
        const strseconds = (seconds < 10) ? '0' + seconds : seconds;

        return `${strhours}:${strminutes}:${strseconds}`;
    }

}
