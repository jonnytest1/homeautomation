
import { Resistor } from "./resistor"
import { GetResistanceOptions } from './wiring.a'
export class Switch extends Resistor {

    enabled = false

    getTotalResistance(from: any, options: GetResistanceOptions): number {
        if (this.enabled) {
            return super.getTotalResistance(from, options)
        }
        return NaN
    }
}