import { Component } from '@angular/core';
import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent {
    constructor() {
        //
    }
    title = 'smarthome';

    mobile$ = AppComponent.isMobile();
    contentOpened: boolean;
    sidenavOpened: boolean;


    public static isMobile() {
        return fromEvent(window, 'resize').pipe(
            map(() => window.innerWidth < 600),
            startWith(window.innerWidth < 600)
        );
    }

    leaveSideNav() {
        this.sidenavOpened = false;
    }
}
