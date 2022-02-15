import { FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { Resistor } from './resistor';
import { v4 } from "uuid"
import { Switch } from './switch';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';
import { ToggleSwitch } from './toggle-switch';
export class Relay extends Resistor {


    uuid = v4()

    switch1 = new ToggleSwitch()

    setSwitchOneEnabled(value: boolean) {
        this.switch1.enabled = value;
    }
    constructor() {
        super(70)
        this.setSwitchOneEnabled(false)

    }

    evaluateFunction(options: CurrentOption): void {
        this.setSwitchOneEnabled(false)
        if (options.current > 0) {
            this.setSwitchOneEnabled(true)
        }
    }


    toJSON() {
        return {
            type: this.constructor.name,
            resistance: this.resistance,
            ui: this.uiNode,
            uuid: this.uuid
        }
    }

    static fromJSON(json: any, map: Record<string, FromJson>, context: FromJsonOptions): InstanceType<typeof this> {
        const led = new Relay();
        JsonSerializer.createUiRepresation(led, json, context)
        return led
    }
}