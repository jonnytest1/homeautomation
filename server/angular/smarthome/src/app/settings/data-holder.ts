import { SenderFe } from './interfaces';
import { SettingsService } from './settings.service';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class DataHolder {
    private static _senders: Array<SenderFe>
    private static _senderSubject = new Subject<Array<SenderFe>>();

    static set senders(senders: Array<SenderFe>) {
        this._senders = senders;
        this._senderSubject.next(senders);
    }

    constructor(private service: SettingsService) {
        setInterval(async () => {
            const senders = await service.getSenders().toPromise();
            DataHolder.senders = senders;

        }, 4000)

    }

    getSenders(): Observable<Array<SenderFe>> {
        return DataHolder._senderSubject.asObservable();
    }
}