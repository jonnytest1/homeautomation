import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vector2 } from './util/vector';
import { InOutComponent } from './wiring-ui/in-out/in-out.component';
import { WireUiComponent } from './wiring-ui/wire-ui/wire-ui.component';
import { Connection } from './wirings/connection';


@Injectable({ providedIn: "root" })
export class WiringDataService {
  dragConnection?: Connection

  wires = new BehaviorSubject<Array<{ from: InOutComponent | Vector2, to: InOutComponent | Vector2 }>>([])

  currentWire: { from: Vector2, to: Vector2 } = undefined

  editingWire: {
    component: WireUiComponent,
    position: Vector2
    toPosition: Vector2
  }


}   