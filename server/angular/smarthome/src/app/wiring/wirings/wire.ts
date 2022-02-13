import { Collection } from './collection';
import { Connection } from './connection';
import { Resistor } from './resistor';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Wire extends Wiring {

    constructor(connectedTo?: Connection) {
        super();
        if (connectedTo) {
            connectedTo.connectedTo = this
        }
    }
    resistance = 0;

    connectedWire: Connection
    getTotalResistance(f: Wiring, options: GetResistanceOptions): number {
        /* let resistancetotal = 0;
 
         this.connectedWires.forEach(res => {
             const connectionResistance = res.getTotalResistance(this, options)
             if(isNaN(connectionResistance)){}
             if (connectionResistance !== 0) {
                 resistancetotal += 1 / connectionResistance;
             }
         })
         if (this.connectedWires.length > 1) {
             debugger;
         }
 
         if (resistancetotal == 0) {
             return 0
         }
         const totalResistance = 1 / resistancetotal;*/

        return this.connectedWire.getTotalResistance(this, options);
    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {

        const connection = this.connectedWire
        return connection.pushCurrent(options, this)
        /*const currents = this.connectedWires.map(wire => wire.parent.pullCurrent({ ...options, test: true }));

        let ampereTotal = currents.reduce((c1, c2) => c1 + c2.remainingAmpereHours, 0)
        // sp = wid * ampere
        for (let i = 0; i < currents.length; i++) {
            const current = currents[i]
            const currentPercent = current.remainingAmpereHours / ampereTotal;
            const actualCurrent = options.maxAmpere * currentPercent
            this.connectedWires[i].parent.pullCurrent({ maxAmpere: actualCurrent, maxVoltage: options.maxVoltage })
        }*/
    }


    static connect(inC: Connection, outC: Connection) {
        let wire = inC.connectedTo
        if (!wire) {
            wire = new Wire(inC)
        }

        wire.connectedWire = outC
    }

    static at(outC: Connection) {
        const wire = new Wire()
        wire.connectedWire = outC
        return wire
    }


    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        options.nodes.push(this)
        return this.connectedWire.register({ ...options, from: this })
    }
}