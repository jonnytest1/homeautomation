import { Component, EmbeddedViewRef, Injector, OnInit, TemplateRef, ViewChild, ViewRef, ɵViewRef } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { FromJson } from '../../serialisation';
import { Connection } from '../../wirings/connection';
import { Resistor } from '../../wirings/resistor';
import { InOutComponent } from '../in-out/in-out.component';
import { UINode } from '../ui-node.a';

@Component({
    selector: 'app-resistor-ui',
    templateUrl: './resistor-ui.component.html',
    styleUrls: ['./resistor-ui.component.less']
})
export class ResistorUiComponent extends UINode<Resistor> implements OnInit {

    public static templateIcon = "insights"

    getIcon(): string {
        return `assets/icons/resistor-svgrepo-com.svg`
    }

    constructor(injector: Injector) {
        super(new Resistor(30), injector)
    }

    ngOnInit() {
    }

    setResistance(input: HTMLInputElement) {
        this.node.resistance = +input.value
    }
}
