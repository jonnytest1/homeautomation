import { Component, Inject, InjectionToken, Input, OnInit, Optional, ViewChild } from '@angular/core';
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

    @Input()
    noInput: BindingBoolean

    @Input()
    offsetVector: Vector2 = Vector2.ZERO


    @Input()
    scale: number | string = 1

    hover = false

    constructor(private wiringService: WiringDataService,
        @Inject(positionInjectionToken) public position: Vector2) {


    }

    private getPosition() {
        return this.position.added(this.offsetVector);
    }

    public getOutVector() {
        const outPutOffset = new Vector2(0, 20)
            .multipliedBy(+this.scale)
            .rotateDeg(this.invers ? 180 : 0)

        return this.getPosition().added(outPutOffset)
    }


    public getInVector() {
        const inputOffset = new Vector2(0, 20)
            .rotateDeg(!this.invers ? 180 : 0)
        return this.getPosition().added(inputOffset)
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
        let draggedOutConnection = this.wiringService.dragConnection
        const draggedParent = draggedOutConnection.parent;
        const draggedConnectionSerial = draggedParent?.controlContainer
        const currnetParent = this.node.inC.parent;
        const currentSerial = currnetParent.controlContainer
        const previousConnection = draggedOutConnection.connectedTo
        this.clearDragCache()
        if (previousConnection && !(previousConnection.outC.parent instanceof ControlCollection)) {
            draggedConnectionSerial.removeAfter(previousConnection)
        }
        if (this.node.inC.parent instanceof Battery) {

            if (currentSerial !== draggedConnectionSerial) {
                this.wiringService.tempSerialBlocks = this.wiringService.tempSerialBlocks.filter(b => b !== draggedConnectionSerial);
                if (draggedConnectionSerial) {
                    currentSerial.addNodes(...draggedConnectionSerial.nodes)
                } else {
                    currentSerial.addNodes(draggedParent)
                }
            }
            currentSerial.connectLast()
        } else if (draggedParent instanceof Battery) {
            if (draggedConnectionSerial == currentSerial) {
                draggedParent.connectTo(draggedConnectionSerial)
            } else {
                this.wiringService.tempSerialBlocks = this.wiringService.tempSerialBlocks.filter(b => b !== currentSerial);
                if (currentSerial) {
                    draggedConnectionSerial.addNodes(...currentSerial.nodes)
                } else {
                    draggedConnectionSerial.addNodes(currnetParent)
                }
            }
            draggedParent.connectTo(draggedConnectionSerial)
        } else {
            const serialBlock = currentSerial
                ?? draggedConnectionSerial;

            if (!serialBlock) {
                this.wiringService.tempSerialBlocks.push(new SerialConnected(draggedOutConnection.parent, this.node.inC.parent))
                return
            }


            serialBlock.addNodes(this.node.inC.parent as any)
        }

    }
}
