import { Inject, Injectable } from '@angular/core';
import { Collection } from './wirings/collection';
import { Connection } from './wirings/connection';
import { SerialConnected } from './wirings/serial-block';

@Injectable({ providedIn: "root" })
export class WiringDataService {
    dragConnection?: Connection


    serialblock: SerialConnected
}   