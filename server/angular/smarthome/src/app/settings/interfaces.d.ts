import { Sender as NodeSender } from "../../../../../models/sender"
import { Connection as NodeConnection } from "../../../../../models/connection"
import { Receiver as NodeReceiver } from "../../../../../models/receiver"

type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
type NonFunctionProperties<T> = Partial<Pick<T, NonFunctionPropertyNames<T>>>;
type CustomOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

export interface DoubleClickCounter {
    lastClick?: number
}
export interface Sender extends CustomOmit<NonFunctionProperties<NodeSender>, "connections">, DoubleClickCounter {
    connections: Array<Connection>
}

export interface Connection extends CustomOmit<NonFunctionProperties<NodeConnection>, "receiver"> {

    receiver: Receiver
}

export interface Receiver extends NonFunctionProperties<NodeReceiver>, DoubleClickCounter {

    /* id: string,
     name: string,
     description: string*/
}