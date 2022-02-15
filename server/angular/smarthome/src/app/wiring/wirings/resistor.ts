
import { FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { UINode } from '../wiring-ui/ui-node.a';
import { Collection } from './collection';
import { Connection } from './connection';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Resistor extends Collection implements Wiring {


    uiNode?: UINode;

    voltageDrop: number
    constructor(public resistance: number) {
        super(null, null)
        this.inC = new Connection(this, "res_in")
        this.outC = new Connection(this, "res_out")
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

    toJSON(): any {
        return {
            type: this.constructor.name,
            resistance: this.resistance,
            outC: this.outC.connectedTo,
            ui: this.uiNode
        }
    }

    static fromJSON(json: any, context: FromJsonOptions): Wire {
        const self = new Resistor(json.resistance);
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        JsonSerializer.createUiRepresation(self, json, context)
        const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC })

        return connected
    }
}