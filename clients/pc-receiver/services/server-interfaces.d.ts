

import { Sound } from '../../../server/src/models/sound';
import { Receiver } from '../../../server/src/models/receiver';

type Primitives = string | number | boolean | Date | undefined;

type NestedNonFunctionProperty<K> = K extends Primitives ? K : (K extends Array<unknown> ? Array<FrontendProperties<K[0]>> : FrontendProperties<K>);

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: (T[K] extends Function ? (never) : K) }[keyof T];
type FrontendProperties<T> = Partial<{ [K in NonFunctionPropertyNames<T>]: NestedNonFunctionProperty<T[K]> }>;

//type CustomOmit<T, K extends string> = Pick<T, Exclude<keyof T, K>>;

//@ts-ignore
//type NestedWith<K, Key, Value> = K extends Primitives ? K : (K extends Array<infer AType> ? Array<With<AType, Key, Value>> : With<K, Key, Value>);


//@ts-ignore
/*type EverythingExceptKey<T, Key, Value> = {
    //@ts-ignore
    [K in Exclude<keyof T, Key>]: NestedWith<T[K], Key, Value>;
};*/
/*
type ValueIfKeyExists<T, Key, Value> = {
    [K in EqualsKeyPropertyNamesList<T, Key>]: Value;
};*/

//@ts-ignore
//type With<T, Key, Value> = Partial<ValueIfKeyExists<T, Key, Value> & EverythingExceptKey<T, Key, Value>>
//type EqualsKeyPropertyNamesList<T, Key> = { [K in keyof T]: (K extends Key ? K : never) }[keyof T];



export type FrontendSound = FrontendProperties<Sound>;

export type FrontendReceiver = FrontendProperties<Receiver>