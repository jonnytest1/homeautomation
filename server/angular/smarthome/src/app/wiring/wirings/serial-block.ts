import { threadId } from 'worker_threads';
import { Collection } from './collection';
import { Connection } from './connection';
import { Parrallel as ParrallelConnected } from './parrallel';
import { Resistor } from './resistor';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class SerialConnected extends Collection implements Wiring {

    constructor(...nodes: Array<Collection & Wiring>) {
        super(null, null)
        this.inC = new Connection(this, "ser_in");
        this.outC = new Connection(this, "ser_out");


        let lastEl = this.inC
        for (let i = 0; i < nodes.length; i++) {

            const currentNode = nodes[i]
            Wire.connect(lastEl, currentNode.inC)
            lastEl = currentNode.outC
        }
        Wire.connect(lastEl, this.outC)

    }

    resistance: number;

    inVoltage: number

    voltageDrop: number
    getTotalResistance(from: Wiring, options: GetResistanceOptions): number {
        if (from == this.outC) {
            return this.outC.getTotalResistance(this, options)
        }
        return this.inC.getTotalResistance(this, options)
    }
    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (from == this.outC) {
            this.voltageDrop = this.inVoltage - options.voltage
            return this.outC.pushCurrent(options, this)
        }
        this.inVoltage = options.voltage
        return this.inC.pushCurrent(options, this)
    }

}