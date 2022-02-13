import { Component, ElementRef, OnInit, TemplateRef } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { BottomSheetHandler } from '../../../settings/bottom-sheet-handler';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { Parrallel } from '../../wirings/parrallel';
import { SerialConnected } from '../../wirings/serial-block';
import { Wiring } from '../../wirings/wiring.a';
import { UINode } from '../ui-node.a';

@Component({
    selector: 'app-battery-ui',
    templateUrl: './battery-ui.component.html',
    styleUrls: ['./battery-ui.component.less']
})
export class BatteryUiComponent extends UINode<Battery> implements OnInit {

    public static templateIcon = "battery_charging_full"
    batteryCollection: Collection;
    snackbarRef: MatSnackBarRef<any>;
    getIcon(): string {
        const percent = this.getChargedPercent()
        const perSeven = Math.floor(percent / (100 / 7))

        if (perSeven == 7) {
            return `battery_full`
        }
        return `battery_${perSeven}_bar`


    }

    getChargedPercent() {
        return +(this.node.ampereHours * 100 / this.node.maxAmpereHours).toPrecision(5)
    }

    constructor(private snackbar: MatSnackBar) {
        super(new Battery(5, 20))

        this.batteryCollection = new Collection(this.node.connectionConsume, this.node.connectionProvide)
    }

    ngOnInit() {
    }
    logStructure(template: TemplateRef<any>) {

        this.snackbarRef = this.snackbar.openFromTemplate(template)

        const structureStart = this.batteryCollection?.outC?.connectedTo?.connectedWire?.parent as (SerialConnected | Parrallel)
        console.log(structureStart.getStructure(true));
    }
}
