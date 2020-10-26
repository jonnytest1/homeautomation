import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, share, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Receiver, Sender } from './interfaces';

@Injectable({ providedIn: 'root' })
export class SettingsService {


    constructor(private http: HttpClient) {

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

    testSend(deviceKey) {
        const dataObj = {
            deviceKey: deviceKey,
            a_read1: -1,
            a_read2: -1,
            a_read3: -1
        };
        return this.http.post<void>(environment.prefixPath + 'rest/sender/trigger', dataObj);
    }
}
