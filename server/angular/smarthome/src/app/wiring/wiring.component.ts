import { AfterContentChecked, AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Button } from 'protractor';
import { Battery } from './wirings/battery';
import { LED } from './wirings/led';
import { Resistor } from './wirings/resistor';
import { SerialConnected } from './wirings/serial-block';
import { Switch } from './wirings/switch';
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
    switch: Switch;
    led: LED;
    resist: Resistor;

    constructor(private cdr: ChangeDetectorRef) {

        const b1 = new Battery(5, 20)
        ///   const b2 = new Battery()

        this.led = new LED()
        this.switch = new Switch(0)
        this.resist = new Resistor(100)


        const con = new SerialConnected(this.resist, this.led, this.switch)

        Wire.connect(b1.connectionProvide, con.inC)
        Wire.connect(con.outC, b1.connectionConsume)

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
