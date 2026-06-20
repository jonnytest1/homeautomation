import type { TimerFe } from '../settings/interfaces';


interface TimeParseOpts {
  hoursLabel?: string
  minutesLabel?: string
}



export class TimerParser {

  static readonly formats = {
    "ultrashort": {
      hoursLabel: "h",
      minutesLabel: "m"
    } as TimeParseOpts
  }

  static msToTime(duration: number, opts: TimeParseOpts = {}) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const strhours = (hours < 10) ? '0' + hours : hours;
    const strminutes = (minutes < 10) ? '0' + minutes : minutes;
    const strseconds = (seconds < 10) ? '0' + seconds : seconds;

    let hoursLabel = opts.hoursLabel ?? ":"
    let minutesLabel = opts.minutesLabel ?? ":"



    return `${strhours}${hoursLabel}${strminutes}${minutesLabel}${strseconds}`;
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
        const nameParts: Array<string> = []


        const ctx = evt.context
        if (ctx && typeof ctx == "object" && "device" in ctx) {
          const dev = ctx.device
          if (dev && typeof dev == "object" && "friendlyName" in dev) {
            const fn = dev.friendlyName
            if (fn && typeof fn == "string") {
              nameParts.push(fn)
            }

          }
        }
        if ("params" in evt) {
          const params = evt.params
          if (params && typeof params == "object" && "name" in params) {
            const name = params.name
            if (name && typeof name == "string") {
              nameParts.push(name)
            }
          }
        }
        subTitleArray.push(nameParts.join(" / "))
      }

    }
    subTitleArray.push(
      `${transformer?.name ?? ''}`
    );
    return subTitleArray;
  }

}
