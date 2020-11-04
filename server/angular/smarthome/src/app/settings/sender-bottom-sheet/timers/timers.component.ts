import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Sender, Timer } from '../../interfaces';
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

  constructor(@Inject(MAT_DIALOG_DATA) public sender: Sender,
    private service: SettingsService, private cdr: ChangeDetectorRef) {
    this.interval = setInterval(async () => {
      if (Date.now() - (1000 * 5) > (this.lastCheck)) {
        const timers = await this.getTimers(service, sender);
        const newTimers = timers.filter(timer => {
          return !this.timers.some(tm => tm.uuid === timer.uuid);
        })

        this.timers.push(...newTimers);
      }

      this.cdr.detectChanges()
    }, 500)

    this.getTimers(service, sender).then(timers => {
      this.timers = timers
      this.cdr.detectChanges();
    });


  }
  private async getTimers(service: SettingsService, sender: Sender) {
    const timers = await service.getTimers(sender.id).toPromise();
    this.cols = Math.ceil(Math.sqrt(timers.length));
    const rows = Math.ceil(timers.length / this.cols);

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

    return timers;

  }

  ngOnDestroy(): void {
    clearInterval(this.interval)
  }
  getPercent(timer: Timer) {
    const duration = timer.time - timer.start;
    this.cdr.markForCheck()
    return 100 - Math.min(Math.round(((timer.time - Date.now()) / duration) * 100), 100)
  }


  getSubtitle(timer: Timer) {
    const remaining = Math.round((timer.time - Date.now()) * 100) / 100;
    return [
      `${msToTime(remaining)}`,
      `${msToTime(Math.round((timer.time - timer.start) * 100) / 100)}`,
      `ends at ${new Date(timer.time).toTimeString().split(' ')[0]}`,
      `${this.sender.transformation.find(tr => tr.transformationKey == timer.data.message).name}`];
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
