import type { ExtendedJsonSchema } from './typing/generic-node-type'
import { zodScripts } from './generic-node-constants'
import { Diagnostic, Program, ScriptKind, ScriptTarget, TypeFormatFlags, createCompilerHost, createProgram, createSourceFile, factory, getPreEmitDiagnostics, isTypeAliasDeclaration } from 'typescript'
import { generateSchema } from 'typescript-json-schema'
import { FetchingJSONSchemaStore, InputData, JSONSchemaInput, quicktype } from 'quicktype-core'

import type * as z from "zod"
import { v4 } from "uuid"
import { join, dirname } from "path"
import { writeFile, mkdir, rm } from "fs/promises"


declare module "typescript" {
  export interface SourceFile {
    getNamedDeclarations(): Map<string, Array<Node>>
  }

}
export const expansionType = `
  type ExpandRecursively<T> = T extends Date 
      ? T 
      : T extends object
        ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
        : T;
`

export function typeMerge(newType: string, oldType: string, mainInterfaceName: string) {
  const source = createSourceFile("text.ts", `
          type ExpandRecursively<T> = T extends object
              ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
              : T;
          declare namespace Previous{
            ${oldType}
          }

          declare namespace Current{
            ${newType}
          }

          type result=ExpandRecursively<(Previous.${mainInterfaceName}|Current.${mainInterfaceName})>;
    `, ScriptTarget.Latest, true, ScriptKind.TS)

  const compilerHost = createCompilerHost({})
  const getSoruce = compilerHost.getSourceFile
  compilerHost.getSourceFile = (file, l, onError, createNew) => {
    if (file == "text.ts") {
      return source
    }
    return getSoruce(file, l, onError, createNew)
  }
  const p = createProgram(["text.ts"], { declaration: true, target: ScriptTarget.Latest }, compilerHost)

  const typeChecker = p.getTypeChecker();

  const mainStatement = source.getNamedDeclarations().get("result")?.[0]
  if (mainStatement && isTypeAliasDeclaration(mainStatement)) {
    const typenode = typeChecker.getTypeFromTypeNode(mainStatement.type)
    // const resultType = typeChecker.getTypeAtLocation(mainStatement)
    const typeAsString = typeChecker.typeToString(typenode, factory.createTypeLiteralNode([]), TypeFormatFlags.InTypeAlias)

    console.log(typeAsString);

    return typeAsString
  } else {
    throw new Error("invalid string")
  }

}


function canDoSchema(jsonSchema: ExtendedJsonSchema) {
  if (jsonSchema.type == "object") {
    return true
  } else if (jsonSchema.type == "string" && (jsonSchema.enum?.length || jsonSchema.const)) {
    return true
  } else if (jsonSchema.type == "string") {
    return false
  } else if (jsonSchema.type == "boolean") {
    return false
  } else if (jsonSchema.type == "number") {
    return false
  }
  debugger
  return false
}


export async function generateDtsFromSchema(jsonSchema: ExtendedJsonSchema) {
  let wrapper = false
  if (!canDoSchema(jsonSchema)) {
    wrapper = true
    jsonSchema = {
      type: "object",
      properties: {
        wrapper: jsonSchema
      },
      required: ["wrapper"],
      additionalProperties: false
    }
  }
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
  await schemaInput.addSource({ name: mainTypeName, schema: JSON.stringify(jsonSchema) });

  const inputData = new InputData();
  inputData.addInput(schemaInput);

  const quicktyped = await quicktype({
    inputData,
    lang: "ts",
    inferDateTimes: true,
    allPropertiesOptional: false,
    rendererOptions: {
      'just-types': 'true',
      "prefer-unions": true,
      "prefer-const-values": true
      //'explicit-unions': 'true',
      //'acronym-style': 'camel',
    }
  });
  const lines = quicktyped.lines;

  if (wrapper) {
    lines[0] = ""
    lines[1] = lines[1].replace(/wrapper: ([^;]*);/, `export type ${mainTypeName} = $1;`).trim()
    lines[2] = ""
    return `
        ${lines.join("\n")}
    `.trim()
  }

  const str = lines.join("\n").trim()


  return str
}


export function programFromSource(name: string, source: string) {

  const tsSourceFile = createSourceFile(name, source, ScriptTarget.Latest)

  const host = createCompilerHost({

  })
  const program = createProgram([name], {
  }, {
    ...host,
    getSourceFile(file, ...args) {
      if (file === name) {
        return tsSourceFile
      }
      return host.getSourceFile(file, ...args)
    }
  })
  return { program, tsSourceFile }
}


export class CompilerError extends Error {

  constructor(message: string, public error_diagnostics: Array<Omit<Diagnostic, "file">>, public program: Program) {
    super(message)

  }
}


export function jsonSchemaFromDts(dts: string, mainType: string) {

  const program = programFromSource("text.ts", `
      ${dts}
  `)

  const emitResults = getPreEmitDiagnostics(program.program)
  if (emitResults.length) {
    const jsonSafeResults = emitResults
      .map(r => ({ ...r, file: null }))
    throw new CompilerError("typescript compiler error while generating schema", jsonSafeResults, program.program)
  }

  const schema = generateSchema(program.program, mainType, {
    //required: true, constAsEnum: true, noExtraProps: true,
  }, ["test.ts"])
  if (schema) {
    return schema as ExtendedJsonSchema
  }
  throw new Error("didnt get a schema")
}


export const mainTypeName = "Main"
export async function generateZodTypeFromSchema(jsonSchema: ExtendedJsonSchema) {
  let wrapper = false
  if (!canDoSchema(jsonSchema)) {
    wrapper = true
    jsonSchema = {
      type: "object",
      properties: {
        wrapper: jsonSchema
      },
      required: ["wrapper"],
      additionalProperties: false
    }
  }
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
  await schemaInput.addSource({ name: mainTypeName, schema: JSON.stringify(jsonSchema) });

  const inputData = new InputData();
  inputData.addInput(schemaInput);

  const quicktyped = await quicktype({
    inputData,
    lang: "typescript-zod",
    inferDateTimes: true,
    allPropertiesOptional: false,
    rendererOptions: {
      'just-types': 'true',
      "prefer-unions": true,
      "prefer-const-values": true
    }
  });
  const lines = quicktyped.lines;

  const str = lines.join("\n").trim()

  const target = join(zodScripts, v4() + ".ts");
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, str)
  const module = require(target)

  if (wrapper) {
    debugger;
  }
  rm(target)
  const zodValidator = module[`${mainTypeName}Schema`] as z.ZodType
  return zodValidator
}
