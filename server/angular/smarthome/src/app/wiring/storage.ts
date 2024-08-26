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
    const nets = []

    for (const battery of batteries) {
      // stringify battery individually, cause no key is used to break up loops
      nets.push(JSON.stringify(battery))
    }
    debugger
    const json = JSON.stringify(nets);
    localStorage.setItem('el_network', json);
    console.log(json);
  }
  async load(options: Partial<FromJsonOptions & { remote: boolean }>): Promise<Array<Battery>> {
    let parsed;
    if (options.remote) {
      const jsonStrings = await this.dataService.getWiringTemplates().toPromise();

      const picked: string = await this.bottomSheet.open(ExamplePickerComponent, {
        data: jsonStrings
      })
        .afterDismissed()
        .toPromise();

      parsed = JSON.parse(picked)
    } else {
      const netStr = localStorage.getItem('el_network');

      parsed = JSON.parse(netStr).map(str => JSON.parse(str))

    }

    debugger


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
      constorlRefsInitialized: controlRefsinitialized.prRef,
      controllerRefs: controllerRefs
    }));
    debugger
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
