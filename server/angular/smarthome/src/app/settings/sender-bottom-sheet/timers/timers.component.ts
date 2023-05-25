import type { TimerFe } from '../../interfaces';
import { SenderFe } from '../../interfaces';
import { SettingsService } from '../../../settings.service';
import type { OnDestroy, OnInit } from '@angular/core';
import { Optional } from '@angular/core';
import { Input } from '@angular/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { combineLatest, Subscription, timer } from 'rxjs';
import { TimerParser } from '../../../utils/time-parser';


@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimersComponent implements OnInit, OnDestroy {

  timers: Array<TimerFe> = [];

  rowDef = '2:2';

  cols;

  scaling = 100;

  subscription = new Subscription();

  first = true;

  @Input()
  public sender: SenderFe

  @Input()
  maxCols: number

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) sender: SenderFe,
    private service: SettingsService,
    private cdr: ChangeDetectorRef) {
    this.sender = sender
  }
  ngOnInit() {
    this.subscription.add(combineLatest([this.service.timers$, timer(0, 600)])
      .subscribe(([timers]) => {
        this.updateTimers(timers);

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
    if (this.maxCols !== undefined) {
      this.cols = Math.min(this.cols, this.maxCols)
    }

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
      timerData.parsedData = JSON.parse(timerData.data);
    }
    return [
      `${TimerParser.msToTime(Math.max(remaining, 0))}`,
      `${TimerParser.msToTime(this.getDuration(timerData))}`,
      `ends at ${new Date(timerData.endtimestamp).toTimeString().split(' ')[0]}`,
      `${this.sender.transformation.find(tr => tr.transformationKey === timerData.parsedData.message)?.name || this.sender.name || ''}`];
  }

  getDuration(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - timerData.startTimestamp) * 100) / 100;
  }

  getRemainingMillis(timerData: TimerFe) {
    return Math.round((timerData.endtimestamp - Date.now()) * 100) / 100;
  }

}
