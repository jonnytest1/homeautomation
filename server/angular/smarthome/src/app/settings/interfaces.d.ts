import { Sender as NodeSender } from '../../../../../models/sender';
import { Timer } from '../../../../../models/timer';
import { Transformation } from '../../../../../models/transformation';



type Primitives = string | number | boolean | Date | undefined;

type NestedNonFunctionProperty<K> = K extends Primitives ? K : (K extends Array<unknown> ? Array<FrontendProperties<K[0]>> : FrontendProperties<K>);

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: (T[K] extends Function ? (never) : K) }[keyof T];
type FrontendProperties<T> = Partial<{ [K in NonFunctionPropertyNames<T>]: NestedNonFunctionProperty<T[K]> }>;

type CustomOmit<T, K extends string> = Pick<T, Exclude<keyof T, K>>;

//@ts-ignore
type NestedWith<K, Key, Value> = K extends Primitives ? K : (K extends Array<infer AType> ? Array<With<AType, Key, Value>> : With<K, Key, Value>);


//@ts-ignore
type EverythingExceptKey<T, Key, Value> = {
    //@ts-ignore
    [K in Exclude<keyof T, Key>]: NestedWith<T[K], Key, Value>;
};

type ValueIfKeyExists<T, Key, Value> = {
    [K in EqualsKeyPropertyNamesList<T, Key>]: Value;
};

//@ts-ignore
type With<T, Key, Value> = Partial<ValueIfKeyExists<T, Key, Value> & EverythingExceptKey<T, Key, Value>>
type EqualsKeyPropertyNamesList<T, Key> = { [K in keyof T]: (K extends Key ? K : never) }[keyof T];


export interface TimerFe extends FrontendProperties<Timer> {
    color?: string

    parsedData?
}

export interface DoubleClickCounter {
    lastClick?: number
}
//@ts-ignore
type SenderWithConnectionTransformation = CustomOmit<With<FrontendProperties<NodeSender>, "transformation", TransformFe>, "transformation">

export interface SenderFe extends SenderWithConnectionTransformation, DoubleClickCounter {
    transformation: Array<TransformFe>
}



export type EventHistoryFe = SenderFe["events"][0] & {
    parsedData?: {
        message?: string
    }
}

export interface TransformFe extends FrontendProperties<Transformation> {
    historyCount?: number

}
export type ConnectionFe = SenderFe["connections"][0] //  With<FrontendProperties<NodeConnection>, "transformation", TransformFe>


export type ReceiverFe = ConnectionFe["receiver"];