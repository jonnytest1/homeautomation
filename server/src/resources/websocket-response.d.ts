
import type { Sender } from "../models/sender"
import type { Timer } from '../models/timer';
export interface SocketResponses {
    timerUpdate: Array<Timer>

    senderUpdate: Array<Sender>
}
