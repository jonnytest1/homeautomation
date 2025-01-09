import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Subscription, timer } from 'rxjs';
import type { SenderFe, TimerFe } from '../settings/interfaces';
import { SettingsService } from '../settings.service';
import { TimerParser } from '../utils/time-parser';

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.scss']
})
export class TimersComponent implements OnInit, OnDestroy {

  timers: Array<TimerFe> = [];

  rowDef = '2:2';

  cols;

  scaling = 100;

  subscription = new Subscription();

  first = true;

  senders: Array<SenderFe>;

  constructor(private service: SettingsService,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.subscription.add(combineLatest([
      this.service.timers$,
      this.service.senders$,
      timer(0, 600)
    ])
      .subscribe(([timers, senders]) => {
        this.updateTimers(timers);
        this.senders = senders;
        if (this.first) {
          // honestly i have no clue why it doesnt work duirectly without this
          // otherwise it will only show the timers after the second time the timer triggers
          // changedetection was run
          this.first = false;
          setTimeout(() => {
            this.cdr.markForCheck();
          }, 10);
        }
      }));
  }
  private updateTimers(timers: TimerFe[]) {

    const newTimers = timers.filter(potentiallyNewTimer => {
      return !this.timers.some(tm => tm.id === potentiallyNewTimer.id);
    });
    this.timers = this.timers.filter(currentTimer => currentTimer.endtimestamp >= (Date.now() - (1000 * 60 * 60 * 24)));
    this.timers.push(...newTimers);
    this.recalc();
  }

  private recalc() {
    this.cols = Math.ceil(Math.sqrt(this.timers.length));
    const rows = Math.ceil(this.timers.length / this.cols);

    if (rows === 1) {
      this.scaling = 100;
      this.rowDef = `2:2`;
    } else if (rows === 2) {
      this.scaling = 80;
      this.rowDef = `2:1.8`;
    } else {
      this.scaling = 70;
      this.rowDef = `2:1.2`;
    }
    this.cdr.detectChanges();
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getPercent(timerData: TimerFe) {
    const duration = this.getDuration(timerData);
    const percent = 100 - Math.max(Math.round(this.getRemainingMillis(timerData) * 100 / duration), 0);

    if (!timerData.color) {
      timerData.color = '#f3e714';
    }
    if (percent > 0.5) {
      timerData.color = '#e4b313';
    }
    if (percent >= 0.98) {
      timerData.color = '#78C000';
    }
    return percent;
  }


  getSubtitle(timerData: TimerFe) {
    const remaining = this.getRemainingMillis(timerData);
    if (!timerData.parsedData) {
      timerData.parsedData = JSON.parse(timerData.data ?? '');
    }
    if (!timerData.parsedArguments) {
      timerData.parsedArguments = JSON.parse(timerData.arguments ?? '');
    }
    const transofrmaionResult = timerData.parsedArguments?.[1];
    const transformer = timerData.parsedArguments[2];

    const subTitleArray = [
      `${TimerParser.msToTime(Math.max(remaining, 0))}`,
      `${TimerParser.msToTime(this.getDuration(timerData))}`,
      `ends at ${new Date(timerData.endtimestamp ?? 0).toTimeString().split(' ')[0]}`,
    ];
    if (transformer.transformation.includes('promise:')) {
      subTitleArray.push(`${transofrmaionResult?.notification?.body || transofrmaionResult?.notification?.title || ''}`);
    }
    subTitleArray.push(
      `${transformer?.name ?? ''}`
    );
    return subTitleArray;
  }

  getDuration(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - timerData.startTimestamp) * 100) / 100;
  }

  getRemainingMillis(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - Date.now()) * 100) / 100;
  }
}
