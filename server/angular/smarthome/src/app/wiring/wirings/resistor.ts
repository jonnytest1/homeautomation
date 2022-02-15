
import { FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { UINode } from '../wiring-ui/ui-node.a';
import { Collection } from './collection';
import { Connection } from './connection';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Resistor extends Collection implements Wiring {


    uiNode?: UINode;
    inC = new Connection(this, "res_in")

    outC = new Connection(this, "res_out")

    voltageDrop: number
    constructor(public resistance: number) {
        super(null, null)
    }
    getTotalResistance(from, options: GetResistanceOptions): number {
        return this.resistance + this.outC.getTotalResistance(this, options)
    }


    evaluateFunction(options: CurrentOption) {
        // to implement
    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        this.voltageDrop = (options.current * this.resistance)
        this.evaluateFunction(options)
        return this.outC.pushCurrent({
            ...options,
            voltage: options.voltage - this.voltageDrop
        }, this);
    }
    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        options.nodes.push(this)
        return this.outC.register({ ...options, from: this })
    }

    toJSON() {
        return {
            type: this.constructor.name,
            resistance: this.resistance,
            ui: this.uiNode
        }
    }

    static fromJSON(json: any, map: Record<string, FromJson>, context: FromJsonOptions): InstanceType<typeof this> {
        const reistor = new Resistor(json.resistance);
        JsonSerializer.createUiRepresation(reistor, json, context)
        return reistor
    }
}