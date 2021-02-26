import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SenderFe, Timer } from '../../interfaces';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-timers',
  templateUrl: './timers.component.html',
  styleUrls: ['./timers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimersComponent implements OnInit, OnDestroy {

  timers: Array<Timer>

  rowDef: string = "2:2"

  cols;

  interval;

  scaling = 100;

  lastCheck = Date.now();

  constructor(@Inject(MAT_DIALOG_DATA) public sender: SenderFe,
    private service: SettingsService, private cdr: ChangeDetectorRef) {
    this.interval = setInterval(async () => {
      this.timers = this.timers.filter(timer => timer.time >= (Date.now() - (1000 * 60 * 60 * 4)))
      if (Date.now() - (1000 * 5) > (this.lastCheck)) {
        const timers = await this.getTimers(service, sender);
        const newTimers = timers.filter(timer => {
          return !this.timers.some(tm => tm.uuid === timer.uuid);
        })
        this.timers.push(...newTimers);
      }
      this.recalc();
    }, 500)

    this.getTimers(service, sender).then(timers => {
      this.timers = timers
      this.recalc();
    });


  }
  private async getTimers(service: SettingsService, sender: SenderFe) {
    const timers = await service.getTimers(sender.id).toPromise();
    return timers;

  }

  private recalc() {
    this.cols = Math.ceil(Math.sqrt(this.timers.length));
    const rows = Math.ceil(this.timers.length / this.cols);

    if (rows == 1) {
      this.scaling = 100;
      this.rowDef = `2:2`;
    } else if (rows == 2) {
      this.scaling = 80;
      this.rowDef = `2:1.8`;
    } else {
      this.scaling = 80;
      this.rowDef = `2:1.2`;
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval)
  }
  getPercent(timer: Timer) {
    const duration = this.getDuration(timer);
    this.cdr.markForCheck()
    const percent = 100 - Math.max(Math.round(this.getRemainingMillis(timer) * 100 / duration), 0);

    if (!timer.color) {
      timer.color = "#f3e714"
    }
    if (percent > 0.5) {
      timer.color = "#e4b313"
    }
    if (percent >= 0.98) {
      timer.color = "#78C000"
    }
    return percent
  }


  getSubtitle(timer: Timer) {
    const remaining = this.getRemainingMillis(timer);
    return [
      `${msToTime(Math.max(remaining, 0))}`,
      `${msToTime(this.getDuration(timer))}`,
      `ends at ${new Date(timer.time).toTimeString().split(' ')[0]}`,
      `${this.sender.transformation.find(tr => tr.transformationKey == timer.data.message).name || this.sender.name || ''}`];
  }

  getDuration(timer: Timer) {
    return Math.round((timer.time - timer.start) * 100) / 100;
  }

  getRemainingMillis(timer: Timer) {
    return Math.round((timer.time - Date.now()) * 100) / 100;
  }
  ngOnInit() {
  }

}

function msToTime(duration: number) {
  var milliseconds = ((duration % 1000) / 100);
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const strhours = (hours < 10) ? "0" + hours : hours;
  const strminutes = (minutes < 10) ? "0" + minutes : minutes;
  const strseconds = (seconds < 10) ? "0" + seconds : seconds;

  return `${strhours}:${strminutes}:${strseconds}`;
}
