import { UINode } from '../wiring-ui/ui-node'
import { RegisterOptions } from './interfaces/registration'


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
  name?: string
  uiNode?: UINode;

  // controlContainer?: SerialConnected;

  // abstract resistance: number

  abstract getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn
  abstract pushCurrent(options: CurrentOption, from: Wiring | null): CurrentCurrent

  abstract register(options: RegisterOptions);


}