import { SenderFe, TransformFe } from '../../interfaces';
import { SettingsService } from '../../settings.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-mobile-sender',
    templateUrl: './mobile-sender.component.html',
    styleUrls: ['./mobile-sender.component.less']
})
export class MobileSenderComponent implements OnInit {


    sender$: Observable<SenderFe>;


    transformer: TransformFe = {};
    constructor(private activeRoute: ActivatedRoute, dataHolder: SettingsService) {

        this.sender$ = dataHolder.senders$.pipe(
            map(senders => senders.find(sender => sender.id === +this.activeRoute.snapshot.params.id))
        );
    }

    ngOnInit() {
        //
    }


    debug(sender) {
        // console.log(sender)
    }
}
