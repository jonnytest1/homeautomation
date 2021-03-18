import { Connection as NodeConnection } from '../../../../../models/connection';
import { EventHistory } from '../../../../../models/event';
import { Receiver as NodeReceiver } from '../../../../../models/receiver';
import { Sender as NodeSender } from '../../../../../models/sender';
import { Timer } from '../../../../../models/timer';
import { Transformation } from '../../../../../models/transformation';

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type NonFunctionProperties<T> = Partial<Pick<T, NonFunctionPropertyNames<T>>>;
type CustomOmit<T, K extends string> = Pick<T, Exclude<keyof T, K>>;

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
    connections: Array<ConnectionFe>

    transformation: Array<TransformFe>

    events: Array<EventHistoryFe>
}

export interface EventHistoryFe extends NonFunctionProperties<EventHistory> {
    parsedData?: unknown
}

export interface TransformFe extends CustomOmit<NonFunctionProperties<Transformation>, ""> {
    historyCount?: number

}
export interface ConnectionFe extends CustomOmit<CustomOmit<NonFunctionProperties<NodeConnection>, "receiver">, "transformation"> {

    receiver: ReceiverFe,

    transformation: TransformFe
}


export interface ReceiverFe extends NonFunctionProperties<NodeReceiver>, DoubleClickCounter {

    /* id: string,
     name: string,
     description: string*/
}