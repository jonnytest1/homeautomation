import { AfterContentChecked, AfterViewChecked, ChangeDetectorRef, Component, ComponentRef, Injector, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Button } from 'protractor';
import { map } from 'rxjs/operators';
import { FromElementJson, FromJson } from './serialisation';
import { Vector2 } from './util/vector';
import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import { InOutComponent, positionInjectionToken } from './wiring-ui/in-out/in-out.component';
import { LedUiComponent } from './wiring-ui/led-ui/led-ui.component';
import { ResistorUiComponent } from './wiring-ui/resistor-ui/resistor-ui.component';
import { SwitchComponent } from './wiring-ui/switch/switch.component';
import { UINode } from './wiring-ui/ui-node.a';
import { WireUiComponent } from './wiring-ui/wire-ui/wire-ui.component';
import { WiringDataService } from './wiring.service';
import { Battery } from './wirings/battery';
import { Collection } from './wirings/collection';
import { Connection } from './wirings/connection';
import { StrucureReturn } from './wirings/control-collection.a';
import { LED } from './wirings/led';
import { Parrallel } from './wirings/parrallel';
import { Resistor } from './wirings/resistor';
import { SerialConnected } from './wirings/serial-block';
import { Switch } from './wirings/switch';
import { Wire } from './wirings/wire';




export interface NodeTemplate {

    new(...args): UINode
    templateIcon: string
}

export type NodeEl = {
    componentRef: ComponentRef<UINode>,
    uiInstance: UINode

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
    nodes: Array<NodeEl> = []
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
            const serialBlcok = this.batteries[this.batteries.length - 1]?.connectionProvide?.connectedTo.connectedWire.parent

            if (serialBlcok && serialBlcok instanceof SerialConnected) {
                const structreArray = serialBlcok?.getStructure(true)

                if (!this.dataStructure || structreArray.length !== this.dataStructure.length) {
                    this.dataStructure = structreArray
                }
            }
        }, 100)
    }

    getWires(strucutre = this.dataStructure): Array<Wire> {
        if (!strucutre) {
            return []
        }
        return strucutre.flatMap(item => {
            if (item instanceof Array) {
                return this.getWires(item)
            }
            return item
        })
            .filter((item): item is Wire => item instanceof Wire)
    }


    storeToLocal() {

        const json = JSON.stringify(this.batteries);
        localStorage.setItem("el_network", json)
        console.log(json)
    }
    loadFromLocal() {
        const json = localStorage.getItem("el_network");
        const parsed = JSON.parse(json)

        const serialisationMap = {}

        const serializerClasses: Array<FromJson> = [SerialConnected, Parrallel, Wire]
        for (const val of serializerClasses) {
            serialisationMap[val.name] = val;
        }

        const elementMap = Object.fromEntries(this.nodeTemplates.map(t => {
            const tempT = new t()
            let nodeConstructor = tempT.node.constructor as unknown as FromElementJson
            nodeConstructor.uiConstructor = t
            return [nodeConstructor.name, nodeConstructor]
        }))
        this.batteries = parsed.map(obj => Battery.fromJSON(obj, serialisationMap, {
            viewRef: this.viewRef,
            displayNodes: this.nodes,
            injectorFactory: this.getInjector.bind(this),
            elementMap: elementMap
        }));

    }
    getWirePositions() {
        const wireList = this.getWires()

        return wireList.map(wire => {
            const connectionParent = wire.fromConnection?.parent
            let from = connectionParent?.uiNode?.getInOutComponent()?.getOutVector();
            if (connectionParent instanceof SerialConnected) {
                from = connectionParent.inC?.connectedTo?.fromConnection?.parent?.uiNode?.getInOutComponent()?.getOutVector()
                if (!from) {
                    return undefined
                }
            }
            const toParent = wire.connectedWire?.parent;
            let to = toParent?.uiNode?.getInOutComponent()?.getInVector();
            if (toParent instanceof SerialConnected) {

                to = toParent.outC?.connectedTo?.connectedWire?.parent?.uiNode?.getInOutComponent()?.getInVector()
                if (!to) {
                    return undefined
                }
            }
            return {
                from: from,
                to: to
            }
        })
    }

    ngOnDestroy(): void {
        clearInterval(this.interval)
    }

    getRemainingBattery(bat: Battery) {
        return bat.ampereSeconds
    }

    mouseMove(event: MouseEvent) {
        if (this.data.currentWire) {
            const position = new Vector2(event).dividedBy(10).rounded().multipliedBy(10);
            this.data.currentWire = { ...this.data.currentWire, to: position }
        }

    }
    updatePosition(node: NodeEl, event: DragEvent) {
        node.uiInstance.getPosition = () => new Vector2({ x: event.x, y: event.y }).dividedBy(10).rounded().multipliedBy(10)
        node.uiInstance.getInOutComponent().position = node.uiInstance.getPosition()
    }


    getInjector(position: Vector2) {
        return Injector.create({
            providers: [{
                provide: positionInjectionToken, useValue: position
            }], parent: this.viewRef.injector
        })
    }

    dropped(el: DragEvent, nodeTemplate: NodeTemplate) {

        const position = new Vector2({ x: el.x, y: el.y }).dividedBy(10).rounded().multipliedBy(10)
        const newNode = this.viewRef.createComponent(nodeTemplate, {
            injector: this.getInjector(position)
        })
        if (newNode.instance instanceof BatteryUiComponent) {
            this.batteries.push(newNode.instance.node);
        }
        newNode.instance.getPosition = () => position

        this.nodes.push({
            componentRef: newNode,
            uiInstance: newNode.instance,
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
