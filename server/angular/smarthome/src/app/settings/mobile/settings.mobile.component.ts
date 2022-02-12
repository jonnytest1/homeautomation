import { SettingsService } from '../../data.service';
import { ChangeDetectorRef, Component } from '@angular/core';
import { first } from 'rxjs/operators';


@Component({
    selector: 'app-settings',
    templateUrl: './settings.mobile.component.html',
    styleUrls: ['./settings.mobile.component.less']
})
export class SettingsMobileComponent {

    readonly tabs = [{
        title: 'Senders',
        items: []
    }, {
        title: 'Receivers',
        items: []
    }];

    currentIndex = 0;
    interval: NodeJS.Timeout;


    constructor(private service: SettingsService, private cdr: ChangeDetectorRef) {
        this.fetchData().then(() => {
            this.cdr.detectChanges();
        });
    }

    getRouterLink(index, id) {
        return `${this.tabs[index].title.toLowerCase()}/${id}`;
    }

    private fetchData() {
        return Promise.all([
            this.service.senders$
                .pipe(first())
                .toPromise()
                .then(senders => {
                    this.tabs[0].items = senders;
                }),
            this.service.getReceivers()
                .toPromise()
                .then(receivers => {
                    this.tabs[1].items = receivers;
                })
        ]);
    }

    left() {
        this.currentIndex--;
        this.currentIndex < 0 && (this.currentIndex = this.tabs.length - 1);
    }

    right() {
        this.currentIndex++;
        this.currentIndex > this.tabs.length - 1 && (this.currentIndex = 0);
    }

    setActive(item, $event) {

    }
}
