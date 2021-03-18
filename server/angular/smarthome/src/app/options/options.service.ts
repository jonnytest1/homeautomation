import { Sound } from './interface ';
import { environment } from '../../environments/environment';
import { AbstractHttpService } from '../utils/http-service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class OptionsService extends AbstractHttpService {

    constructor(http: HttpClient, router: Router) {
        super(http, router);
    }

    getSounds(): Observable<Array<Sound>> {
        return this.get<Array<Sound>>(`${environment.prefixPath}rest/auto/sound/all`)
    }

    saveSound(addingSound: Sound) {
        return this.post(`${environment.prefixPath}rest/auto/sound`, {
            key: addingSound.key,
            bytes: addingSound.bytes
        });
    }


}