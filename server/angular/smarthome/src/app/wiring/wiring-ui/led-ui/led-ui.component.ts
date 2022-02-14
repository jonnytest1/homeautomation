import { Component, OnInit, ViewChild } from '@angular/core';
import { FromJson } from '../../serialisation';
import { Battery } from '../../wirings/battery';
import { Connection } from '../../wirings/connection';
import { LED } from '../../wirings/led';
import { InOutComponent } from '../in-out/in-out.component';
import { UINode } from '../ui-node.a';

@Component({
    selector: 'app-led-ui',
    templateUrl: './led-ui.component.html',
    styleUrls: ['./led-ui.component.less']
})
export class LedUiComponent extends UINode<LED> implements OnInit {
    public static templateIcon = "emoji_objects"
    @ViewChild(InOutComponent)
    public inOutComponent?: InOutComponent
    getIcon(): string {
        return `emoji_objects`
    }

    constructor() {
        super(new LED())
    }

    ngOnInit() {
    }
    static fromJSON(json: any, map: Record<string, FromJson>, context: { inC: Connection; }): Connection {

        debugger;
        return null

    };
}
