import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, share, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Receiver, Sender, Timer, TransformFe } from './interfaces';

@Injectable({ providedIn: 'root' })
export class SettingsService {


    constructor(private http: HttpClient) {

    }

    getTimers(id: number) {
        return this.http.get<Array<Timer>>(`${environment.prefixPath}rest/sender/${id}/timers`)
    }


    createTransformer(el: TransformFe, senderId) {
        return this.http.post<TransformFe>(`${environment.prefixPath}rest/sender/${senderId}/transformation`, el)
    }

    getMissingSenderKeys(senderId: number) {
        return this.http.get<Array<string>>(`${environment.prefixPath}rest/transformation/keys/${senderId}`)
    }


    getSenders() {
        return this.http.get<Array<Sender>>(environment.prefixPath + 'rest/sender').pipe(
            map(senders =>
                senders.sort((s1, s2) => s1.id > s2.id ? 1 : -1)
            )
        );
    }

    getReceivers() {
        return this.http.get<Array<Receiver>>(environment.prefixPath + 'rest/receiver');
    }
    getTitleKeys(id): Observable<string> {
        return this.http.get<Array<string>>(`${environment.prefixPath}rest/connection/key?itemRef=${id}`).pipe(
            map(keys => `context: ${keys.join(', ')}`)
        );
    }

    getSenderTitleKeys(id: number): Observable<string> {
        return this.http.get<Array<string>>(`${environment.prefixPath}rest/sender/key?itemRef=${id}`).pipe(
            map(keys => `context: ${keys.join(', ')}`)
        );
    }


    deleteConneciton(id: number) {
        return this.http.delete(`${environment.prefixPath}rest/connection?itemRef=${id}`)
    }


    testSend(deviceKey) {
        const dataObj = {
            testsend: true,
            deviceKey: deviceKey,
            a_read1: -1,
            a_read2: -1,
            a_read3: -1
        };
        return this.http.post<void>(environment.prefixPath + 'rest/sender/trigger', dataObj);
    }
}
