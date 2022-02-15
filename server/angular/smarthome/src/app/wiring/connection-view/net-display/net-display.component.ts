import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { skip } from 'rxjs/operators';
import { Collection } from '../../wirings/collection';
import { ControlCollection, StrucureReturn } from '../../wirings/control-collection.a';
import { Resistor } from '../../wirings/resistor';
import { Wire } from '../../wirings/wire';
import { Wiring } from '../../wirings/wiring.a';

@Component({
    selector: 'app-net-display',
    templateUrl: './net-display.component.html',
    styleUrls: ['./net-display.component.less']
})
export class NetDisplayComponent implements OnInit {

    @Input()
    data: StrucureReturn

    parsedData: StrucureReturn = []
    indentItem = []
    constructor() { }

    isArray(item: StrucureReturn | Wiring) {
        return item instanceof Array
    }

    cast(item): StrucureReturn {
        return item
    }

    ngOnChanges(event: SimpleChanges) {
        if (event["data"].currentValue) {
            this.ngOnInit()
        }
    }

    ngOnInit() {
        let subArray: StrucureReturn
        if (!this.data) {
            return
        }
        this.indentItem = []
        this.parsedData = []

        let skipNext = false
        for (const item of this.data) {
            if (skipNext) {
                skipNext = false;
                continue
            }

            if (this.indentItem.length) {

                if (item == this.indentItem[this.indentItem.length - 1]) {
                    this.parsedData.push(item)
                    this.indentItem.pop()
                } else {
                    subArray.push(item)

                }
            } else if (item instanceof ControlCollection) {
                subArray = []
                this.parsedData.push(item)
                this.parsedData.push(subArray)
                this.indentItem.push(item)
            } else if (item instanceof Collection && this.data.length > 3 && !(item instanceof Wire)) {
                const inConnection = this.parsedData.pop()
                skipNext = true
                this.parsedData.push([inConnection, item, item.outC])
            } else {
                this.parsedData.push(item)
            }
        }
        //debugger;
    }

}
