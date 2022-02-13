import { Collection } from './collection';
import { Connection } from './connection';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Resistor extends Collection implements Wiring {


    inC = new Connection(this, "res_in")

    outC = new Connection(this, "res_out")

    voltageDrop: number
    constructor(public resistance: number) {
        super(null, null)
    }
    getTotalResistance(from, options: GetResistanceOptions): number {
        return this.resistance + this.outC.getTotalResistance(this, options)
    }


    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        this.voltageDrop = (options.current * this.resistance)
        return this.outC.pushCurrent({
            ...options,
            voltage: options.voltage - this.voltageDrop
        }, this);
    }
    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        options.nodes.push(this)
        return this.outC.register({ ...options, from: this })
    }
}