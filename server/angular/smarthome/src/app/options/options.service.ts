import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Sound } from './interface ';

@Injectable()
export class OptionsService {

    constructor(private http: HttpClient) { }

    getSounds(): Observable<Array<Sound>> {
        return this.http.get<Array<Sound>>(`${environment.prefixPath}rest/auto/sound/all`)
    }

    saveSound(addingSound: Sound) {
        return this.http.post(`${environment.prefixPath}rest/auto/sound`, {
            key: addingSound.key,
            bytes: addingSound.bytes
        });
    }


}