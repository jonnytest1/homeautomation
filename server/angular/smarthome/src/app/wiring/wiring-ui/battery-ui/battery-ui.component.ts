import { Component, ElementRef, Inject, InjectionToken, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { BottomSheetHandler } from '../../../settings/bottom-sheet-handler';
import { FromJson } from '../../serialisation';
import { Vector2 } from '../../util/vector';
import { Battery } from '../../wirings/battery';
import { Collection } from '../../wirings/collection';
import { Connection } from '../../wirings/connection';
import { Parrallel } from '../../wirings/parrallel';
import { Wiring } from '../../wirings/wiring.a';
import { InOutComponent } from '../in-out/in-out.component';
import { UINode } from '../ui-node.a';

@Component({
    selector: 'app-battery-ui',
    templateUrl: './battery-ui.component.html',
    styleUrls: ['./battery-ui.component.less']
})
export class BatteryUiComponent extends UINode<Battery>  {

    public static templateIcon = "battery_charging_full"
    batteryCollection: Collection;
    snackbarRef: MatSnackBarRef<any>;


    @ViewChild(InOutComponent)
    public inOutComponent?: InOutComponent
    getIcon(): string {
        const percent = this.getChargedPercent()
        const perSeven = Math.floor(percent / (100 / 7))

        if (perSeven == 7) {
            return `battery_full`
        }
        return `battery_${perSeven}_bar`


    }

    getChargedPercent() {
        return +(this.node.ampereSeconds * 100 / this.node.maxAmpereSeconds).toPrecision(5)
    }

    constructor(private snackbar: MatSnackBar) {
        super(new Battery(5, 0.0001))


    }

    ngOnInit() {
        this.batteryCollection = new Collection(this.node.inC, this.node.outC)
    }

    refill() {
        this.node.ampereSeconds = this.node.maxAmpereSeconds;
    }

    logStructure(template: TemplateRef<any>) {

        this.snackbarRef = this.snackbar.openFromTemplate(template)

        /*const structureStart = this.node.get batteryCollection?.outC?.connectedTo?.outC?.parent as (SerialConnected | Parrallel)
        console.log(structureStart.getStructure(true));*/
    }

    static fromJSON(json: any, map: Record<string, FromJson>, context: { inC: Connection; }): Connection {

        throw new Error("not implemented")

    };
}
