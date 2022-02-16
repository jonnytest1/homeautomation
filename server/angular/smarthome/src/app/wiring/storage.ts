import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsService } from '../data.service';
import { ResolvablePromise } from '../utils/resolvable-promise';
import { ExamplePickerComponent } from './example-wires/example-picker/example-picker.component';
import { FromJsonOptions } from './serialisation';
import { Battery } from './wirings/battery';

@Injectable()
export class LocalStorageSerialization {

    constructor(private dataService: SettingsService, private bottomSheet: MatBottomSheet) { }
    storeToLocal(batteries: Array<Battery>,
    ) {

        const json = JSON.stringify(batteries);
        localStorage.setItem("el_network", json)
        console.log(json)
    }
    async load(options: Partial<FromJsonOptions & { remote: boolean }>): Promise<Array<Battery>> {
        let json: string;
        if (options.remote) {
            const jsonStrings = await this.dataService.getWiringTemplates().toPromise()

            const picked: string = await this.bottomSheet.open(ExamplePickerComponent, {
                data: jsonStrings
            })
                .afterDismissed()
                .toPromise()

            json = picked
        } else {
            json = localStorage.getItem("el_network");
        }
        const parsed = JSON.parse(json)



        return this.parseJson(parsed, options);

    }

    public parseJson(parsed: any, options: Partial<FromJsonOptions & { remote: boolean; }>) {
        const controlRegfs = {};
        const controllerRefs: Record<string, { setControlRef: (controlRef, uuid: string) => void; }> = {};

        const controlRefsinitialized = new ResolvablePromise<void>();

        const batteries = parsed.map(obj => Battery.fromJSON(obj, {
            ...options,
            elementMap: options.elementMap,
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