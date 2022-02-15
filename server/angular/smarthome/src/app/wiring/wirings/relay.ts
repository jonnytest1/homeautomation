import { ControllerRef, FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { Resistor } from './resistor';
import { v4 } from "uuid"
import { Switch } from './switch';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';
import { ToggleSwitch } from './toggle-switch';
import { Wire } from './wire';
export class Relay extends Resistor implements ControllerRef {


    controlRef = v4()

    switch1 = new ToggleSwitch()

    setSwitchOneEnabled(value: boolean) {
        this.switch1.enabled = value;
    }



    constructor() {
        super(70)
        this.setSwitchOneEnabled(false)
        this.switch1.controlRef = this.controlRef

    }
    setControlRef(controlRef: any, key: string) {
        this.switch1 = controlRef
    };

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
            outC: this.outC.connectedTo,
            ui: this.uiNode,
            uuid: this.controlRef
        }
    }

    static fromJSON(json: any, context: FromJsonOptions): Wire {
        const self = new Relay();
        self.controlRef = json.uuid
        context.controllerRefs[json.uuid] = self;
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        JsonSerializer.createUiRepresation(self, json, context)
        const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC })

        //JsonSerializer.createUiRepresation(tSwitch, json, context)
        return connected
    }
}