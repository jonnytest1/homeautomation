import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, share, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Connection, Receiver, Sender, Timer, TransformFe } from './interfaces';
import { v4 as uuid } from "uuid"

@Injectable({ providedIn: 'root' })
export class SettingsService {

    constructor(private http: HttpClient) {

    }
    addConnection(deviceKey: string, receiverId: number) {

        return this.http.post<Connection>(`${environment.prefixPath}rest/connection`, {
            senderId: deviceKey,
            receiverId: receiverId
        })

    }

    addSender() {
        return this.http.post<Sender>(`${environment.prefixPath}rest/sender`, {
            type: "manual",
            deviceKey: uuid()
        })
    }


    deleteSender(id: number) {
        return this.http.delete<Sender>(`${environment.prefixPath}rest/auto/sender?itemRef=${id}`)
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


    send(obj) {
        return this.http.post<void>(environment.prefixPath + 'rest/sender/trigger', obj);
    }
}
