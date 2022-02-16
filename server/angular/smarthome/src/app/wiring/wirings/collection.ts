import { Connection } from './connection';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';


export class Collection extends Wiring {


    constructor(public inC: Connection, public outC: Connection) {
        super();
        this["id"] = Math.random()
    }


    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        if (options.from == this.outC) {
            options.nodes.push(this)
            return this.outC.register({ ...options, from: this });
        }
        options.nodes.push(this)
        return this.inC.register({ ...options, from: this })
    }

    toJSON(): any {
        return {
            type: this.constructor.name
        }
    }

    getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn {
        throw new Error('Method not implemented.');
    }
    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        throw new Error('Method not implemented.');
    }
}