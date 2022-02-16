import { Collection } from './collection';
import { ParrallelWire } from './parrallel-wire';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Connection implements Wiring {


    constructor(public parent: Wiring, private id: string) { }


    resistance: number;


    connectedTo?: Wire | ParrallelWire

    getTotalResistance(from: Wiring | null, options: GetResistanceOptions): ResistanceReturn {
        let target = this.parent

        if (from === this.parent) {
            target = this.connectedTo

        }
        if (target == undefined) {
            return {
                resistance: NaN
            }
        }
        return target.getTotalResistance(this, options)
    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        let target = this.parent

        if (from === this.parent) {
            target = this.connectedTo

        }
        if (target == undefined) {
            return
        }
        return target.pushCurrent(options, this)

    }
    register(options: { nodes: any[]; until: Wiring; from?: any; }) {
        options.nodes.push(this)
        let target = this.parent

        if (options.from === this.parent) {
            target = this.connectedTo

        }
        if (target == undefined) {
            return
        }
        target.register({ ...options, from: this })
    }
}