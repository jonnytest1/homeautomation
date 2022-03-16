import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SettingsService } from '../settings.service';
import { ResolvablePromise } from '../utils/resolvable-promise';
import { ExamplePickerComponent } from './example-wires/example-picker/example-picker.component';
import { NODE_TEMPLATES } from './node-templates';
import type { FromJson, FromJsonOptions } from './serialisation';
import { Battery } from './wirings/battery';
import { ParrallelWire } from './wirings/parrallel-wire';
import { ToggleSwitch } from './wirings/toggle-switch';
import { Wire } from './wirings/wire';

@Injectable()
export class LocalStorageSerialization {

  serialisationMap: Partial<FromJsonOptions["elementMap"]> = {};

  constructor(private dataService: SettingsService, private bottomSheet: MatBottomSheet) {
    this.initializeSerializerClasses();
  }


  private initializeSerializerClasses() {
    const serializerClasses: Array<FromJson> = [Wire, ToggleSwitch, ParrallelWire];
    for (const val of serializerClasses) {
      this.serialisationMap[val.name] = val;
    }

    NODE_TEMPLATES.forEach(t => {
      const tempT = new t(null);
      const nodeConstructor = tempT.node.constructor as unknown as FromJson;
      nodeConstructor.uiConstructor = t;
      this.serialisationMap[nodeConstructor.name] = nodeConstructor;
    });
  }


  storeToLocal(batteries: Array<Battery>,
  ) {

    const json = JSON.stringify(batteries);
    localStorage.setItem('el_network', json);
    console.log(json);
  }
  async load(options: Partial<FromJsonOptions & { remote: boolean }>): Promise<Array<Battery>> {
    let json: string;
    if (options.remote) {
      const jsonStrings = await this.dataService.getWiringTemplates().toPromise();

      const picked: string = await this.bottomSheet.open(ExamplePickerComponent, {
        data: jsonStrings
      })
        .afterDismissed()
        .toPromise();

      json = picked;
    } else {
      json = localStorage.getItem('el_network');
    }
    const parsed = JSON.parse(json);



    return this.parseJson(parsed, options);

  }

  public parseJson(parsed: Array<any>, options: Partial<FromJsonOptions>): Array<Battery> {
    const controlRegfs = {};
    const controllerRefs: Record<string, { setControlRef: (controlRef, uuid: string) => void; }> = {};

    const controlRefsinitialized = new ResolvablePromise<void>();

    const batteries = parsed.map(obj => Battery.fromJSON(obj, {
      ...options,
      elementMap: this.serialisationMap as FromJsonOptions["elementMap"],
      controlRefs: controlRegfs,
      constorlRefsInitialized: controlRefsinitialized,
      controllerRefs: controllerRefs
    }));

    Object.keys(controllerRefs).forEach(key => {
      const controller = controllerRefs[key];
      const controlRef = controlRegfs[key];
      if (controlRef) {
        controller.setControlRef(controlRef, key);
      }
    });

    controlRefsinitialized.resolve();
    return batteries;
  }
}
