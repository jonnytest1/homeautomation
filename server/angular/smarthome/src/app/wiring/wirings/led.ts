
import { FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { Connection } from './connection';
import { Resistor } from './resistor';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class LED extends Resistor {
    brightness: number = 0;

    blown = false


    constructor() {
        super(15)
    }

    getTotalResistance(from: any, options: GetResistanceOptions): number {
        if (this.blown) {
            return NaN
        }
        return super.getTotalResistance(from, options)
    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        const returnCurrent = super.pushCurrent(options, from)
        if (options.current > 0) {
            if (this.voltageDrop > 2.6) {
                this.blown = true;
                return
            }
            this.brightness = 100
        } else {
            this.brightness = 0
        }

        return returnCurrent
    }

    backgroundColor() {
        if (this.blown) {
            return "red"
        }
        return `hsl(54deg,100%,${Math.min(100, this.brightness)}%)`
    }

    toJSON() {
        return {
            type: this.constructor.name,
            resistance: this.resistance,
            ui: this.uiNode
        }
    }

    static fromJSON(json: any, map: Record<string, FromJson>, context: FromJsonOptions): InstanceType<typeof this> {
        const led = new LED();
        JsonSerializer.createUiRepresation(led, json, context)
        return led
    }
}