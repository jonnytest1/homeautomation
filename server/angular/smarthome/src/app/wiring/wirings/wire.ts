
import { FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { Battery } from './battery';
import { Collection } from './collection';
import { Connection } from './connection';
import { Resistor } from './resistor';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Wire extends Collection {

    constructor(inConnection?: Connection) {
        super(inConnection, null);
        if (inConnection) {
            inConnection.connectedTo = this
        }
    }
    resistance = 0;

    outC: Connection


    public isViewWire = true
    getTotalResistance(f: Wiring, options: GetResistanceOptions): number {
        return this.outC.getTotalResistance(this, options);
    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {

        const connection = this.outC
        return connection.pushCurrent(options, this)
    }


    static connect(inC: Connection, outC: Connection) {
        let wire = inC.connectedTo
        if (!wire) {
            wire = new Wire(inC)
        }

        wire.connect(outC)
    }

    connect(other: Connection) {
        this.outC = other
        other.connectedTo = this
    }

    static at(outC: Connection) {
        const wire = new Wire()
        wire.connect(outC)
        return wire
    }


    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        options.nodes.push(this)
        return this.outC.register({ ...options, from: this })
    }

    toJSON() {
        return {
            type: this.constructor.name,
            connectedWire: this.outC.parent instanceof Battery ? "BatteryRef" : this.outC.parent,
            ui: this.uiNode
        }
    }

    static fromJSON(json: any, map: Record<string, FromJson>, context: FromJsonOptions): Wire {
        const wire = new Wire(context.inC)
        if (json.connectedWire == "BatteryRef") {
            return wire;
        }

        const connected = map[json.connectedWire.type].fromJSON(json.connectedWire, map, { ...context, wire })

        return connected
    };
}