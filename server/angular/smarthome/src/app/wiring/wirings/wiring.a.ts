import { UINode } from '../wiring-ui/ui-node.a'
import { Connection } from './connection'
import { Wire } from './wire'


export type CurrentCurrent = {
    voltage: number,
    current: number,
    remainingAmpereHours: number
}

export type CurrentOption = {
    /**
     * current in ampere
     */
    current: number
    voltage: number,
    resistance: number,
    deltaSeconds: number
}

export type GetResistanceOptions = {
    forParrallel?: number
}

export abstract class Wiring {

    uiNode?: UINode;

    // abstract resistance: number

    abstract getTotalResistance(from: Wiring, options: GetResistanceOptions): number
    abstract pushCurrent(options: CurrentOption, from: Wiring | null): CurrentCurrent

    abstract register(options: { nodes: any[], until: Wiring, from?: any });
}