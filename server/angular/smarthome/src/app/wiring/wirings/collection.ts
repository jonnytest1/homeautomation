import { Connection } from './connection';
import { Wiring } from './wiring.a';


export class Collection {

    constructor(public inC: Connection, public outC: Connection) {
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

    toJSON() {
        return {
            type: this.constructor.name
        }
    }
}