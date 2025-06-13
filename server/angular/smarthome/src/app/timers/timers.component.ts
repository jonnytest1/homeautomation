import type { AfterViewChecked, ElementRef, OnDestroy, OnInit, QueryList } from '@angular/core';
import { ChangeDetectorRef, Component, HostListener, ViewChildren } from '@angular/core';
import { combineLatest, Subscription, timer } from 'rxjs';
import type { SenderFe, TimerFe } from '../settings/interfaces';
import { SettingsService } from '../settings.service';
import { TimerParser } from '../utils/time-parser';

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.scss'],

})
export class TimersComponent implements OnInit, OnDestroy, AfterViewChecked {

  timers: Array<TimerFe> = [];

  rowDef = '2:2';

  cols;

  scaling = 100;

  subscription = new Subscription();

  first = true;

  senders: Array<SenderFe>;

  @ViewChildren("timerWrapper")
  items: QueryList<ElementRef<HTMLElement>>

  constructor(private service: SettingsService,
    private cdr: ChangeDetectorRef) {}

  @HostListener('window:resize')
  ngAfterViewChecked(): void {
    let smallest = Infinity

    for (const item of this.items) {
      smallest = Math.min(item.nativeElement.getBoundingClientRect().width, smallest)
    }

    for (const item of this.items) {
      item.nativeElement.style.maxWidth = Math.floor(smallest) + "px"
    }

  }

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

    this.timers = [...this.timers, ...newTimers].filter(currentTimer => currentTimer.endtimestamp >= (Date.now() - (1000 * 60 * 60 * 24)));
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
    return TimerParser.getSubtitles(timerData, remaining)
  }

  getDuration(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - timerData.startTimestamp) * 100) / 100;
  }

  getRemainingMillis(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - Date.now()) * 100) / 100;
  }
}
