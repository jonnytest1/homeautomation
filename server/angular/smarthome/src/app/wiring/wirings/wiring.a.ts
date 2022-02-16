import { ControlContainer } from '@angular/forms'
import { UINode } from '../wiring-ui/ui-node.a'
import { Connection } from './connection'
import { ControlCollection } from './control-collection.a'
import { Wire } from './wire'


export type CurrentCurrent = {
    voltage: number,
    current: number,
    remainingAmpereHours: number,
    afterBlockCurrent: Array<CurrentCurrent>
}

export type CurrentOption = {
    /**
     * current in ampere
     */
    current: number
    voltage: number,
    resistance: number,
    deltaSeconds: number,
    triggerTimestamp: number,
    currentAfterBlock?: number
    voltageAfterBlock?: number
}

export type GetResistanceOptions = {
    forParrallel?: number
}


export interface ResistanceReturn {
    resistance: number

    afterBlock?: ResistanceReturn
}

export abstract class Wiring {

    uiNode?: UINode;

    // controlContainer?: SerialConnected;

    // abstract resistance: number

    abstract getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn
    abstract pushCurrent(options: CurrentOption, from: Wiring | null): CurrentCurrent

    abstract register(options: { nodes: any[], until: Wiring, from?: any });


}