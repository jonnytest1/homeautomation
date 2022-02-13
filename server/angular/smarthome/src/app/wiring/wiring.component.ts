import { AfterContentChecked, AfterViewChecked, ChangeDetectorRef, Component, ComponentRef, Injector, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Button } from 'protractor';
import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import { LedUiComponent } from './wiring-ui/led-ui/led-ui.component';
import { ResistorUiComponent } from './wiring-ui/resistor-ui/resistor-ui.component';
import { SwitchComponent } from './wiring-ui/switch/switch.component';
import { UINode } from './wiring-ui/ui-node.a';
import { ViewTemplateComponent } from './wiring-ui/view-template/view-template.component';
import { WiringDataService } from './wiring.service';
import { Battery } from './wirings/battery';
import { StrucureReturn } from './wirings/control-collection.a';
import { LED } from './wirings/led';
import { Resistor } from './wirings/resistor';
import { SerialConnected } from './wirings/serial-block';
import { Switch } from './wirings/switch';
import { Wire } from './wirings/wire';
import { Wiring } from './wirings/wiring.a';


export interface NodeTemplate {

    new(...args): UINode
    templateIcon: string
}

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

    dataStructure: StrucureReturn

    nodeTemplates: Array<NodeTemplate> = [BatteryUiComponent, LedUiComponent, ResistorUiComponent, SwitchComponent]
    nodes: Array<{
        componentRef: ComponentRef<UINode>,
        icon: string,
        x: number,
        y: number, instance
    }> = []
    constructor(private cdr: ChangeDetectorRef, private viewRef: ViewContainerRef, public data: WiringDataService) {

        const b1 = new Battery(5, 20)
        ///   const b2 = new Battery()

        this.led = new LED()
        this.switch = new Switch()
        this.resist = new Resistor(100)


        const con = new SerialConnected(this.resist, this.led, this.switch)

        Wire.connect(b1.connectionProvide, con.inC)
        Wire.connect(con.outC, b1.connectionConsume)

        this.batteries = []


        this.interval = setInterval(() => {
            this.cdr.markForCheck()
            const structreArray = this.data.serialblock?.getStructure(true)

            if (!this.dataStructure || structreArray.length !== this.dataStructure.length) {
                this.dataStructure = structreArray
            }
        }, 100)
    }
    ngOnDestroy(): void {
        clearInterval(this.interval)
    }

    getRemainingBattery(bat: Battery) {
        return bat.ampereHours
    }

    dropped(el: DragEvent, nodeTemplate: NodeTemplate) {
        const newNode = this.viewRef.createComponent(nodeTemplate)
        if (newNode.instance instanceof BatteryUiComponent) {
            this.batteries.push(newNode.instance.node);
            this.data.serialblock = new SerialConnected()
            Wire.connect(newNode.instance.node.connectionProvide, this.data.serialblock.inC)


            /*   const led = new LED()
               const resist = new Resistor(100)
               const con = new SerialConnected(resist, led)
               Wire.connect(newNode.instance.node.connectionProvide, con.inC)
               Wire.connect(con.outC, newNode.instance.node.connectionConsume)*/
        }



        this.nodes.push({
            componentRef: newNode,
            x: el.x,
            y: el.y,
            icon: "battery_full",
            instance: newNode.location.nativeElement
        })
        this.cdr.markForCheck()
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
