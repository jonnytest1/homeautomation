import { SenderFe, TimerFe } from '../../interfaces';
import { SettingsService } from '../../settings.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { combineLatest, Subscription, timer } from 'rxjs';


@Component({
    selector: 'app-timers',
    templateUrl: './timers.component.html',
    styleUrls: ['./timers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimersComponent implements OnInit, OnDestroy {

    timers: Array<TimerFe>;

    rowDef = '2:2';

    cols;

    scaling = 100;

    subscription = new Subscription();

    constructor(@Inject(MAT_DIALOG_DATA) public sender: SenderFe,
        private service: SettingsService, private cdr: ChangeDetectorRef) {

        this.subscription.add(combineLatest([this.service.timers$, timer(0, 2000)])
            .subscribe(([timers]) => {
                if (!this.timers) {
                    this.timers = timers;
                } else {
                    const newTimers = timers.filter(potentiallyNewTimer => {
                        return !this.timers.some(tm => tm.id === potentiallyNewTimer.id);
                    });
                    this.timers.push(...newTimers);
                    this.timers = this.timers.filter(currentTimer => currentTimer.endtimestamp >= (Date.now() - (1000 * 60 * 60 * 4)));
                }
                this.recalc();
            }));
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
            this.scaling = 80;
            this.rowDef = `2:1.2`;
        }
        this.cdr.detectChanges();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
    getPercent(timerData: TimerFe) {
        const duration = this.getDuration(timerData);
        this.cdr.markForCheck();
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
            `${msToTime(Math.max(remaining, 0))}`,
            `${msToTime(this.getDuration(timerData))}`,
            `ends at ${new Date(timerData.endtimestamp).toTimeString().split(' ')[0]}`,
            `${this.sender.transformation.find(tr => tr.transformationKey === timerData.parsedData.message)?.name || this.sender.name || ''}`];
    }

    getDuration(timerData: TimerFe) {
        return Math.round((timerData.endtimestamp - timerData.startTimestamp) * 100) / 100;
    }

    getRemainingMillis(timerData: TimerFe) {
        return Math.round((timerData.endtimestamp - Date.now()) * 100) / 100;
    }
    ngOnInit() {
        //
    }

}

function msToTime(duration: number) {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const strhours = (hours < 10) ? '0' + hours : hours;
    const strminutes = (minutes < 10) ? '0' + minutes : minutes;
    const strseconds = (seconds < 10) ? '0' + seconds : seconds;

    return `${strhours}:${strminutes}:${strseconds}`;
}
