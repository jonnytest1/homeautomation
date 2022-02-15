import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
    snackbarRef: MatSnackBarRef<any>;

    @ViewChild(InOutComponent)
    public inOutComponent?: InOutComponent

    getIcon(): string {
        return `assets/icons/resistor-svgrepo-com.svg`
    }

    constructor(private snackbar: MatSnackBar) { super(new Resistor(100)) }

    ngOnInit() {
    }

    openSnackbar(template: TemplateRef<any>) {
        this.snackbarRef = this.snackbar.openFromTemplate(template)
    }

    setResistance(input: HTMLInputElement) {
        this.node.resistance = +input.value
    }
}
