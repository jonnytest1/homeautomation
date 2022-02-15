
import { Connection } from './connection'
import { Resistor } from "./resistor"
import { GetResistanceOptions } from './wiring.a'
export class Switch extends Resistor {



    enabled = false


    negatedOutC = new Connection(this, "switch_out_negated")
    constructor() {
        super(0)
    }
    getTotalResistance(from: any, options: GetResistanceOptions): number {
        if (this.enabled) {
            return super.getTotalResistance(from, options)
        }
        return NaN
    }
}