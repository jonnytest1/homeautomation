import type { JSONSchema6 } from 'json-schema';

type ExtendedJsonSchema = JSONSchema6 & {
  merged?: boolean;
  _optional?: Array<string>;
};


export type Schemata = {
  jsonSchema: ExtendedJsonSchema;
  dts: string;
  globalModDts?: string;
  mainTypeName: "Main";
};
