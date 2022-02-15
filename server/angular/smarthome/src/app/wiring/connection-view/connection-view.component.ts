import { Component, Input, OnInit } from '@angular/core';
import { StrucureReturn } from '../wirings/control-collection.a';

@Component({
    selector: 'app-connection-view',
    templateUrl: './connection-view.component.html',
    styleUrls: ['./connection-view.component.less']
})
export class ConnectionViewComponent implements OnInit {
    @Input()
    data: Array<StrucureReturn>


    currentIndex: number = 0
    constructor() { }

    ngOnInit() {
    }

}
