import { Connection as NodeConnection } from '../../../../../models/connection';
import { EventHistory } from '../../../../../models/event';
import { Receiver as NodeReceiver } from '../../../../../models/receiver';
import { Sender as NodeSender } from '../../../../../models/sender';
import { Timer } from '../../../../../models/timer';
import { Transformation } from '../../../../../models/transformation';

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type NonFunctionProperties<T> = Partial<Pick<T, NonFunctionPropertyNames<T>>>;
type CustomOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export interface TimerFe extends Timer {
    color?: string

    parsedData?
}

export interface DoubleClickCounter {
    lastClick?: number
}
export interface SenderFe extends CustomOmit<
    CustomOmit<
        CustomOmit<
            NonFunctionProperties<NodeSender>, "connections"
        >, "transformation"
    >, "events">, DoubleClickCounter {
    connections: Array<Connection>

    transformation: Array<TransformFe>

    events: Array<EventHistoryFe>
}

export interface EventHistoryFe extends NonFunctionProperties<EventHistory> {
    parsedData?: any
}

export interface TransformFe extends CustomOmit<NonFunctionProperties<Transformation>, ""> {
    historyCount?: number

}
export interface Connection extends CustomOmit<NonFunctionProperties<NodeConnection>, "receiver"> {

    receiver: Receiver
}


export interface Receiver extends NonFunctionProperties<NodeReceiver>, DoubleClickCounter {

    /* id: string,
     name: string,
     description: string*/
}