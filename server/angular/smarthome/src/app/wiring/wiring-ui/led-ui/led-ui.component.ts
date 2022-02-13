import { Component, OnInit } from '@angular/core';
import { Battery } from '../../wirings/battery';
import { LED } from '../../wirings/led';
import { UINode } from '../ui-node.a';

@Component({
    selector: 'app-led-ui',
    templateUrl: './led-ui.component.html',
    styleUrls: ['./led-ui.component.less']
})
export class LedUiComponent extends UINode<LED> implements OnInit {
    public static templateIcon = "emoji_objects"
    getIcon(): string {
        return `emoji_objects`
    }

    constructor() {
        super(new LED())
    }

    ngOnInit() {
    }

}
