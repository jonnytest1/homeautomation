import { ConnectionFe, ReceiverFe, SenderFe, TimerFe, TransformFe } from './interfaces';
import { environment } from '../../environments/environment';
import { AbstractHttpService } from '../utils/http-service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';


@Injectable({ providedIn: 'root' })
export class SettingsService extends AbstractHttpService {

    constructor(http: HttpClient, router: Router) {
        super(http, router);
    }
    addConnection(deviceKey: string, receiverId: number) {
        return this.post<ConnectionFe>(`${environment.prefixPath}rest/connection`, {
            senderId: deviceKey,
            receiverId: receiverId
        });

    }

    addSender() {
        return this.post<SenderFe>(`${environment.prefixPath}rest/sender`, {
            type: "manual",
            deviceKey: uuid()
        })
    }


    deleteSender(id: number) {
        return this.delete<SenderFe>(`${environment.prefixPath}rest/auto/sender?itemRef=${id}`)
    }




    getTimers(id: number) {
        return this.get<Array<TimerFe>>(`${environment.prefixPath}rest/sender/${id}/timers`)
    }


    createTransformer(el: TransformFe, senderId) {
        return this.post<TransformFe>(`${environment.prefixPath}rest/sender/${senderId}/transformation`, el)
    }

    getMissingSenderKeys(senderId: number) {
        return this.get<Array<string>>(`${environment.prefixPath}rest/transformation/keys/${senderId}`)
    }


    getSenders() {
        return this.get<Array<SenderFe>>(environment.prefixPath + 'rest/sender').pipe(
            map(senders =>
                senders.sort((s1, s2) => s1.id > s2.id ? 1 : -1)
            ),
            tap(senders => {
                const def = senders
                    .filter(s => s.transformation.length)
                    .map(s => s.transformation[0].definitionFile)[0]

                senders.forEach(s => {
                    s.connections.
                        filter(con => con.transformation)
                        .forEach(c => {
                            c.transformation.definitionFile = def;
                        })
                })
            })
        );
    }

    getReceivers() {
        return this.get<Array<ReceiverFe>>(environment.prefixPath + 'rest/receiver');
    }
    getTitleKeys(id): Observable<string> {
        return this.get<Array<string>>(`${environment.prefixPath}rest/connection/key?itemRef=${id}`).pipe(
            map(keys => `context: ${keys.join(', ')}`)
        );
    }

    getSenderTitleKeys(id: number): Observable<string> {
        return this.get<Array<string>>(`${environment.prefixPath}rest/sender/key?itemRef=${id}`).pipe(
            map(keys => `context: ${keys.join(', ')}`)
        );
    }


    deleteConneciton(id: number) {
        return this.delete(`${environment.prefixPath}rest/connection?itemRef=${id}`)
    }


    send(obj) {
        return this.post<void>(environment.prefixPath + 'rest/sender/trigger', obj);
    }
}
