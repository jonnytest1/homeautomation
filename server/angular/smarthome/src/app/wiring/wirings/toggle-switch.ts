import { Connection } from './connection';
import { Switch } from './switch';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class ToggleSwitch extends Switch {



    negatedOutC = new Connection(this, "switch_out_negated")
    getTotalResistance(from: any, options: GetResistanceOptions): number {
        if (this.enabled) {
            return super.getTotalResistance(from, options)
        } else {
            return this.negatedOutC.getTotalResistance(this, options)
        }
    }
    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (this.enabled) {
            return super.pushCurrent(options, from);
        }

        this.voltageDrop = (options.current * this.resistance)
        return this.negatedOutC.pushCurrent({
            ...options,
            voltage: options.voltage - this.voltageDrop
        }, this);


    }
}