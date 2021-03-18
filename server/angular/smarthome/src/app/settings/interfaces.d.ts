import { Connection as NodeConnection } from '../../../../../models/connection';
import { EventHistory } from '../../../../../models/event';
import { Sender as NodeSender } from '../../../../../models/sender';
import { Timer } from '../../../../../models/timer';
import { Transformation } from '../../../../../models/transformation';



type Primitives = string | number | boolean | Date;

type NestedNonFunctionProperty<K> = K extends Primitives ? K : (K extends Array<unknown> ? Array<FrontendProperties<K[0]>> : FrontendProperties<K>);

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: (T[K] extends Function ? (never) : K) }[keyof T];
type FrontendProperties<T> = Partial<{ [K in NonFunctionPropertyNames<T>]: NestedNonFunctionProperty<T[K]> }>;

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
            FrontendProperties<NodeSender>, "connections"
        >, "transformation"
    >, "events">, DoubleClickCounter {
    connections: Array<ConnectionFe>

    transformation: Array<TransformFe>

    events: Array<EventHistoryFe>
}

export interface EventHistoryFe extends FrontendProperties<EventHistory> {
    parsedData?: {
        message?: string
    }
}

export interface TransformFe extends FrontendProperties<Transformation> {
    historyCount?: number

}
export interface ConnectionFe extends CustomOmit<FrontendProperties<NodeConnection>, "transformation"> {


    transformation: TransformFe
}


export type ReceiverFe = ConnectionFe["receiver"];
