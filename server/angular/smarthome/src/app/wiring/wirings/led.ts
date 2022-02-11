
import { Connection } from './connection';
import { Resistor } from './resistor';
import { CurrentCurrent, CurrentOption, Wiring } from './wiring.a';

export class LED extends Resistor {

    constructor() {
        super(1)
    }


    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        return super.pushCurrent(options, from)
    }
}