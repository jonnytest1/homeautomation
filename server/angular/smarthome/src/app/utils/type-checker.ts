import { Primitives } from '../settings/interfaces';

export function hasTypedProperty<X extends Record<string, never>, Y extends PropertyKey>(
    obj: X,
    prop: Y
): obj is X & Record<Y, unknown> {
    return obj.hasOwnProperty(prop);
}


export function propertyEquals<Prop extends Primitives, Value extends Prop>(
    prop: Prop,
    value: Value
): prop is Value {
    return prop === value;
}


export type BindingBoolean = boolean | "true"