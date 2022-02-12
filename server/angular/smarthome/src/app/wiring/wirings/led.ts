
import { Connection } from './connection';
import { Resistor } from './resistor';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class LED extends Resistor {
    brightness: number;

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
        if (options.current > 0) {
            if (options.voltage > 2.6) {
                this.blown = true;
                return super.pushCurrent(options, from)
            }
            this.brightness = 100
        } else {
            this.brightness = 0
        }

        return super.pushCurrent(options, from)
    }

    backgroundColor() {
        if (this.blown) {
            return "red"
        }
        return `hsl(54deg,100%,${Math.min(100, this.brightness)}%)`
    }
}