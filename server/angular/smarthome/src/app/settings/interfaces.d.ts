import { Sender as NodeSender } from "../../../../../models/sender"
import { Connection as NodeConnection } from "../../../../../models/connection"
import { Receiver as NodeReceiver } from "../../../../../models/receiver"
import { Transformer } from '../../../../../models/transformer';
import { Transformation } from '../../../../../models/transformation';

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type NonFunctionProperties<T> = Partial<Pick<T, NonFunctionPropertyNames<T>>>;
type CustomOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export interface DoubleClickCounter {
    lastClick?: number
}
export interface Sender extends CustomOmit<CustomOmit<NonFunctionProperties<NodeSender>, "connections">, "transformation">, DoubleClickCounter {
    connections: Array<Connection>

    transformation: Array<TransformFe>
}
export interface TransformFe extends CustomOmit<NonFunctionProperties<Transformation>, ""> {

}
export interface Connection extends CustomOmit<NonFunctionProperties<NodeConnection>, "receiver"> {

    receiver: Receiver
}

export interface Timer {
    start: number,
    time: number,
    data: any,
    uuid: string
}

export interface Receiver extends NonFunctionProperties<NodeReceiver>, DoubleClickCounter {

    /* id: string,
     name: string,
     description: string*/
}