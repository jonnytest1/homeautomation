import { Component, ElementRef, Inject, InjectionToken, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { BoundingBox } from '../../util/bounding-box';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { ControlCollection } from '../../wirings/control-collection.a';
import { ParrallelWire } from '../../wirings/parrallel-wire';
import { Wire } from '../../wirings/wire';
import { Wiring } from '../../wirings/wiring.a';
import { UINode } from '../ui-node.a';
import { WireUiComponent } from '../wire-ui/wire-ui.component';

@Component({
    selector: 'app-in-out',
    templateUrl: './in-out.component.html',
    styleUrls: ['./in-out.component.less']
})
export class InOutComponent implements OnInit {

    @Input()
    node: Collection

    @Input()
    invers: BindingBoolean

    @Input()
    noInput: BindingBoolean

    hover = false

    @ViewChild("inLabel")
    public inLabel: ElementRef<HTMLElement>

    @ViewChild("outLabel")
    public outLabel: ElementRef<HTMLElement>

    constructor(private wiringService: WiringDataService) {


    }

    public getOutVector() {
        return new BoundingBox(this.outLabel).center()
    }

    public getInVector() {
        const inVec = new BoundingBox(this.inLabel).center();
        return inVec
    }

    ngOnInit() {

    }

    markDropZone($event) {

        this.hover = true
    }
    leaveDropZone() {
        this.hover = false
    }

    clearDragCache() {
        this.hover = false
        this.wiringService.dragConnection = undefined
        this.wiringService.currentWire = undefined
    }

    storeOutgoing() {
        this.wiringService.dragConnection = this.node.outC
        this.wiringService.currentWire = { from: this.getOutVector(), to: this.getOutVector() }
    }

    onDrop(event) {
        if (this.wiringService.dragConnection) {
            let draggedOutConnection = this.wiringService.dragConnection
            this.clearDragCache()

            Wire.connect(draggedOutConnection, this.node.inC)
        } else if (this.wiringService.editingWire) {

            const parrallelWireEnd = new ParrallelWire()
            parrallelWireEnd.newInC(this.wiringService.editingWire.component.wire.inC)
            parrallelWireEnd.newOutC(this.wiringService.editingWire.component.wire.outC)
            parrallelWireEnd.newOutC(this.node.inC)
        }
    }
}
