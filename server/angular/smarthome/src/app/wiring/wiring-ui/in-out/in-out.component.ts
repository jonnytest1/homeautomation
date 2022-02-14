import { Component, Inject, InjectionToken, Input, OnInit, ViewChild } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { Vector2 } from '../../util/vector';
import { WiringDataService } from '../../wiring.service';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { ControlCollection } from '../../wirings/control-collection.a';
import { SerialConnected } from '../../wirings/serial-block';
import { Wire } from '../../wirings/wire';
import { Wiring } from '../../wirings/wiring.a';
import { UINode } from '../ui-node.a';
import { WireUiComponent } from '../wire-ui/wire-ui.component';

export const positionInjectionToken = new InjectionToken("_ITEM_POSITION_VECTOR")
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

    hover = false

    constructor(private wiringService: WiringDataService,
        @Inject(positionInjectionToken) public position: Vector2) {


    }

    public getOutVector() {
        const outPutOffset = new Vector2(0, 20)
            .rotateDeg(this.invers ? 180 : 0)

        return this.position.added(outPutOffset)
    }


    public getInVector() {
        const inputOffset = new Vector2(0, 20)
            .rotateDeg(!this.invers ? 180 : 0)
        return this.position.added(inputOffset)
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
        this.wiringService.dragConnection = undefined
        this.wiringService.currentWire = undefined
    }

    storeOutgoing() {
        this.wiringService.dragConnection = this.node.outC
        this.wiringService.currentWire = { from: this, to: this.getOutVector() }
    }

    onDrop(event) {
        const previousConnection = this.wiringService.dragConnection.connectedTo
        if (previousConnection && !(previousConnection.connectedWire.parent instanceof ControlCollection)) {
            this.wiringService.serialblock.removeAfter(this.wiringService.dragConnection.connectedTo)
        }
        if (this.node.inC.parent instanceof Battery) {
            Wire.connect(this.wiringService.serialblock.outC, this.node.inC)
        } else {
            if (!this.wiringService.serialblock && this.wiringService.dragConnection.parent instanceof Battery) {
                this.wiringService.serialblock = new SerialConnected()
                Wire.connect(this.wiringService.dragConnection.parent.connectionProvide, this.wiringService.serialblock.inC)
            }
            this.wiringService.serialblock.addNode(this.node.inC.parent as any)
        }

    }
}
