import type { TimerFe } from '../settings/interfaces';

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


  static getDuration(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - timerData.startTimestamp) * 100) / 100;
  }

  static getSubtitles(timerData: TimerFe, remainingMillis: number) {

    if (!timerData.parsedData) {
      timerData.parsedData = JSON.parse(timerData.data ?? '');
    }
    if (!timerData.parsedArguments) {
      timerData.parsedArguments = JSON.parse(timerData.arguments ?? '');
    }
    const transofrmaionResult = timerData.parsedArguments?.[1];
    const transformer = timerData.parsedArguments[2];

    const subTitleArray = [
      `${TimerParser.msToTime(Math.max(remainingMillis, 0))}`,
      `${TimerParser.msToTime(this.getDuration(timerData))}`,
      `ends at ${new Date(timerData.endtimestamp ?? 0).toTimeString().split(' ')[0]}`,
    ];
    if (transformer?.transformation?.includes('promise:')) {
      subTitleArray.push(`${transofrmaionResult?.notification?.body || transofrmaionResult?.notification?.title || ''}`);
    } else {
      const evt = timerData.parsedArguments[1]
      if (evt && "context" in evt) {
        const ctx = evt.context
        if (ctx && typeof ctx == "object" && "device" in ctx) {
          const dev = ctx.device
          if (dev && typeof dev == "object" && "friendlyName" in dev) {
            const fn = dev.friendlyName
            if (fn && typeof fn == "string") {
              subTitleArray.push(fn)
            }

          }
        }
      }
    }
    subTitleArray.push(
      `${transformer?.name ?? ''}`
    );
    return subTitleArray;
  }

}
