import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Vector2 } from './util/vector';
import type { InOutComponent } from './wiring-ui/in-out/in-out.component';
import type { WireUiComponent } from './wiring-ui/wire-ui/wire-ui.component';
import type { Connection } from './wirings/connection';


@Injectable({ providedIn: 'root' })
export class WiringDataService {
  dragConnection?: Connection;

  wires = new BehaviorSubject<Array<{ from: InOutComponent | Vector2, to: InOutComponent | Vector2 }>>([]);

  currentWire: { from: Vector2, to: Vector2 } = undefined;

  editingWire: {
    component: WireUiComponent,
    position: Vector2
    toPosition: Vector2
  };
  draggedNode: import("d:/Jonathan/Projects/node/homeautomation/server/angular/smarthome/src/app/wiring/wiring.component").NodeEl;


}