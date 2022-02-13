import { Component, Input, OnInit } from '@angular/core';
import { BindingBoolean } from '../../../utils/type-checker';
import { WiringDataService } from '../../wiring.service';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { ControlCollection } from '../../wirings/control-collection.a';
import { Wire } from '../../wirings/wire';
import { Wiring } from '../../wirings/wiring.a';

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

    constructor(private wiringService: WiringDataService) { }

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
    }

    storeOutgoing() {
        this.wiringService.dragConnection = this.node.outC
    }

    onDrop(event) {
        const previousConnection = this.wiringService.dragConnection.connectedTo
        if (previousConnection && !(previousConnection.connectedWire.parent instanceof ControlCollection)) {
            this.wiringService.serialblock.removeAfter(this.wiringService.dragConnection.connectedTo)
        }
        if (this.node.inC.parent instanceof Battery) {
            Wire.connect(this.wiringService.serialblock.outC, this.node.inC)
        } else {
            this.wiringService.serialblock.addNode(this.node.inC.parent as any)
        }
        //   debugger;
        //
        //Wire.connect(this.wiringService.dragConnection, this.node.outC)

    }
}
