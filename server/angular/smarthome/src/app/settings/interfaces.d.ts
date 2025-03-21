import type { TransformationRes } from '../../../../../src/models/connection-response';
import type { Sender as NodeSender } from '../../../../../src/models/sender';
import type { Timer } from '../../../../../src/models/timer';
import type { Item } from '../../../../../src/models/inventory/item';
import type { Location } from '../../../../../src/models/inventory/location';
import type { Transformation } from '../../../../../src/models/transformation';
import type { SocketResponses as sR, GenericNodeEvents as GNE, ActionTriggersEvent as ATE }
  from "../../../../../src/resources/websocket-response"

export * from "../../../../../src/services/mqtt-types"
export * from "../../../../../src/services/generic-node/typing/element-node"
export * from "../../../../../src/services/generic-node/typing/node-definition"
export * from "../../../../../src/services/generic-node/typing/generic-node-type"
export * from "../../../../../src/services/generic-node/typing/frontend-events"
export * from "../../../../../src/services/generic-node/typing/node-options"
export type { FrontendToBackendEvents } from "../../../../../src/resources/socket-events"

export type SocketResponses = sR;
export type GenericNodeEvents = GNE;
export type ActionTriggersEvent = ATE;

export interface ResponseData<K extends keyof SocketResponses = keyof SocketResponses> {
  type: K,
  data: SocketResponses[K]
}

export type Primitives = string | number | boolean | Date | undefined;

type NestedNonFunctionProperty<K> = K extends Primitives ? K : (K extends Array<unknown> ? Array<FrontendProperties<K[0]>> : FrontendProperties<K>);

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: (T[K] extends Function ? (never) : K) }[keyof T];
type FrontendProperties<T> = Partial<{ [K in NonFunctionPropertyNames<T>]: NestedNonFunctionProperty<T[K]> }>;

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

type EqualsKeyPropertyNamesList<T, Key> = { [K in keyof T]: (K extends Key ? K : never) }[keyof T];

type FeSubProps<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? Array<U> : FrontendProperties<T[K]>
}

type Replace<T, A extends FeSubProps<T>> = {
  [K in keyof T]: K extends keyof A ? A[K] : T[K]
}


export interface TimerFe extends FrontendProperties<Timer> {
  parsedArguments?: [string, TransformationRes, TransformFe];
  color?: string

  parsedData?
}

export interface DoubleClickCounter {
  lastClick?: number
}

export type SenderFe = Replace<FrontendProperties<NodeSender>, {
  transformation: Array<TransformFe>,
}> & DoubleClickCounter



export type EventHistoryFe = SenderFe["events"][0] & {
  parsedData?: {
    message?: string
  }
}

export interface TransformFe extends FrontendProperties<Transformation> {
  historyCount?: number

  sender?: number

}
export type ConnectionFe = SenderFe["connections"][0] //  With<FrontendProperties<NodeConnection>, "transformation", TransformFe>


export type ReceiverFe = ConnectionFe["receiver"];


export type ItemFe = FrontendProperties<Item>
export type LocationFe = FrontendProperties<Location>