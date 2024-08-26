import type { ExtendedJsonSchema } from 'json-schema-merger';



export type Schemata = {
  jsonSchema: ExtendedJsonSchema;
  dts: string;
  globalModDts?: string;
  mainTypeName: "Main";
};
