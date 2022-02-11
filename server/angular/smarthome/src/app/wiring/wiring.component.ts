import { AfterContentChecked, AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Battery } from './wirings/battery';
import { LED } from './wirings/led';
import { Wire } from './wirings/wire';

@Component({
    selector: 'app-wiring',
    templateUrl: './wiring.component.html',
    styleUrls: ['./wiring.component.scss']
})
export class WiringComponent implements OnInit, AfterContentChecked, OnDestroy {
    batteries: Battery[];


    lastTime: number
    interval: NodeJS.Timeout;

    constructor(private cdr: ChangeDetectorRef) {

        const b1 = new Battery(5, 20)
        ///   const b2 = new Battery()

        const led = new LED()

        Wire.connect(b1.connectionProvide, led.inC)
        Wire.connect(led.outC, b1.connectionConsume)

        this.batteries = [b1]


        this.interval = setInterval(() => {
            this.cdr.markForCheck()
        }, 100)
    }
    ngOnDestroy(): void {
        clearInterval(this.interval)
    }

    getRemainingBattery(bat: Battery) {
        return bat.ampereHours
    }

    ngAfterContentChecked(): void {
        const now = Date.now()
        if (!this.lastTime) {
            this.lastTime = now;
            return
        }
        const delta = now - this.lastTime
        this.lastTime = now
        this.batteries.forEach(b => b.checkContent(delta / 1000));
    }

    ngOnInit() {
    }

}
