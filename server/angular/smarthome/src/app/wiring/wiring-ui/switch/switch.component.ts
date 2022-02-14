import { Component, OnInit, ViewChild } from '@angular/core';
import { FromJson } from '../../serialisation';
import { Connection } from '../../wirings/connection';
import { Switch } from '../../wirings/switch';
import { InOutComponent } from '../in-out/in-out.component';
import { UINode } from '../ui-node.a';

@Component({
    selector: 'app-switch',
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.less']
})
export class SwitchComponent extends UINode<Switch> implements OnInit {
    public static templateIcon = "switch_left"


    @ViewChild(InOutComponent)
    public inOutComponent?: InOutComponent
    getIcon(): string {
        if (this.node.enabled) {
            return "toggle_on"
        }
        return "toggle_off"
    }

    constructor() {
        super(new Switch())
    }

    ngOnInit() {
    }
    static fromJSON(json: any, map: Record<string, FromJson>, context: { inC: Connection; }): Connection {

        debugger;
        return null
    };
}
