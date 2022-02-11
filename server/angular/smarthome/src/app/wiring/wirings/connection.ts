import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Connection implements Wiring {

    constructor(public parent: Wiring, private id: string) { }
    resistance: number;


    connectedTo?: Wire

    getTotalResistance(from: Wiring | null, options: GetResistanceOptions): number {
        if (from === this.parent) {
            return this.connectedTo.getTotalResistance(this, options)
        } else {
            return this.parent.getTotalResistance(this, options)
        }
    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (from === this.parent) {
            return this.connectedTo.pushCurrent(options, this)
        } else {
            return this.parent.pushCurrent(options, this)
        }
    }
}