import { Collection } from './collection';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Connection implements Wiring {


    constructor(public parent: Wiring & Collection, private id: string) { }


    resistance: number;


    connectedTo?: Wire

    getTotalResistance(from: Wiring | null, options: GetResistanceOptions): number {
        let target = this.parent

        if (from === this.parent) {
            target = this.connectedTo

        }
        if (target == undefined) {
            return NaN
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