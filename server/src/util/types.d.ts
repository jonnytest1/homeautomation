export type NullSafe<T> = T extends undefined ? never : T



declare const s: unique symbol;
export type SettersIntercepted = { [s]: true }