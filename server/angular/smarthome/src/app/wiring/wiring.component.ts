import { AfterContentChecked, AfterViewChecked, ChangeDetectorRef, Component, ComponentRef, Injector, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Button } from 'protractor';
import { map } from 'rxjs/operators';
import { FromElementJson, FromJson } from './serialisation';
import { Vector2 } from './util/vector';
import { BatteryUiComponent } from './wiring-ui/battery-ui/battery-ui.component';
import { InOutComponent, positionInjectionToken } from './wiring-ui/in-out/in-out.component';
import { LedUiComponent } from './wiring-ui/led-ui/led-ui.component';
import { RelayUiComponent } from './wiring-ui/relay-ui/relay-ui.component';
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

    dataStructures: Array<StrucureReturn> = []

    wirePositions: Array<{ from: Vector2, to: Vector2 }> = []

    nodeTemplates: Array<NodeTemplate> = [
        BatteryUiComponent, LedUiComponent, ResistorUiComponent, SwitchComponent, RelayUiComponent
    ]


    nodes: Array<NodeEl> = []
    constructor(private cdr: ChangeDetectorRef, private viewRef: ViewContainerRef, public data: WiringDataService) {

        this.batteries = []


        this.interval = setInterval(() => {
            this.cdr.markForCheck()


            this.dataStructures.length = this.batteries.length + this.data.tempSerialBlocks.length
            this.batteries.forEach((battery, i) => {
                const serialBlcok = battery.controlContainer

                if (serialBlcok && serialBlcok instanceof SerialConnected) {
                    const structreArray = serialBlcok?.getStructure(true)

                    if (!this.dataStructures[i] || structreArray.length !== this.dataStructures[i].length) {
                        this.dataStructures[i] = structreArray
                    }
                }
            })

            this.data.tempSerialBlocks.forEach((tempSerial, i) => {
                this.dataStructures[this.batteries.length + i] = tempSerial.getStructure(true)
            })

            this.wirePositions = this.getWirePositions()
        }, 100)
    }

    getWires(strucutres = this.dataStructures): Array<Wire> {
        if (!strucutres.length) {
            return []
        }

        return strucutres.flatMap(item => {
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
        const wireList = this.getWires(this.dataStructures)

        return wireList.map(wire => {
            const connectionParent = wire.inC?.parent
            let from = connectionParent?.uiNode?.getInOutComponent()?.getOutVector();
            if (connectionParent instanceof SerialConnected) {
                if (!connectionParent.inC.connectedTo) {
                    return undefined
                }
                // pass to battery
                from = connectionParent.inC?.connectedTo?.inC?.parent?.uiNode?.getInOutComponent()?.getOutVector()

            }
            const toParent = wire.outC?.parent;
            let to = toParent?.uiNode?.getInOutComponent()?.getInVector();
            if (toParent instanceof SerialConnected) {

                to = toParent.outC?.connectedTo?.outC?.parent?.uiNode?.getInOutComponent()?.getInVector()

            }
            if (!to || !from) {
                return undefined
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
        this.wirePositions = this.getWirePositions()

    }
    updatePosition(node: NodeEl, event: DragEvent) {

        node.uiInstance.setPosition(new Vector2({ x: event.x, y: event.y }).dividedBy(10).rounded().multipliedBy(10));
        this.wirePositions = this.getWirePositions()

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
        newNode.instance.setPosition(position)

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
