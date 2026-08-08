export type JSONSchema = {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: readonly string[];
  items?: JSONSchema;
};


export type SimpleSchemaType<S extends JSONSchema> =
  S["type"] extends "object"
  ? ObjectType<S>
  : S["type"] extends "array"
  ? SimpleSchemaType<NonNullable<S["items"]>>[]
  : S["type"] extends "string"
  ? string
  : S["type"] extends "number"
  ? number
  : S["type"] extends "boolean"
  ? boolean
  : never;
type RequiredKeys<S> =
  S extends { required: readonly (infer R)[] }
  ? R
  : never;



type ObjectType<S extends JSONSchema> = {
  -readonly [K in keyof NonNullable<S["properties"]>]:
  K extends RequiredKeys<S>
  ? SimpleSchemaType<NonNullable<S["properties"]>[K]>
  : SimpleSchemaType<NonNullable<S["properties"]>[K]> | undefined;
};