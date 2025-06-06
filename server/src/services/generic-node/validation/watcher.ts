import { JsonSchemaWatcher } from './json-schema-watcher';
import { create, validateMorph } from './morph';
import { CompilerError, postfix } from '../json-schema-type-util';
import { ResolvablePromise } from '../../../util/resolvable-promise';
import {
  Diagnostic, SemanticDiagnosticsBuilderProgram, WatchOfConfigFile, createSemanticDiagnosticsBuilderProgram,
  createWatchCompilerHost, createWatchProgram, sys
} from 'typescript';
import type { ExtendedJsonSchema } from 'json-schema-merger';
import { ts } from 'ts-morph';
import { join, basename } from 'path';
import { writeFileSync } from 'fs';

const tsconfig = join(__dirname, "files", "tsconfig.json")
const types = join(__dirname, "files", "types")



const fileRromiseMap: Record<string, { res, err, starttime?: number, timeadded: number, path: string }> = {}

export async function validate(filename: string, dts: string, tracer?: string) {

  const file = join(types, filename + ".ts")
  while (fileRromiseMap[filename]) {
    await ResolvablePromise.delayed(5)
  }
  return new Promise<string>((res, err) => {


    const valdiationTimeout = setTimeout(() => {
      console.warn("validate didnt resolve ", dts)

    }, 1000)


    fileRromiseMap[filename] = {
      res: (a) => {
        clearTimeout(valdiationTimeout)
        res(a)
      }, err, timeadded: Date.now(), path: file
    }



    writeFileSync(file, `// ${Date.now()}
    export {}
${dts}

`)
    console.log("validating type " + tracer)
  })
}

function reportDiagnostic(diagnostic: Diagnostic, ...args) {
  if (diagnostic.file) {
    const fileBaseName = basename(diagnostic.file.fileName, ".ts");
    const promiseRef = fileRromiseMap[fileBaseName]
    if (promiseRef) {
      const diagObj = { ...diagnostic, file: diagnostic.file?.fileName }
      promiseRef.err(new CompilerError("typescript compiler error", [diagObj]))
      delete fileRromiseMap[fileBaseName]
    }
  }
}
/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
function reportWatchStatusChanged(diagnostic: Diagnostic, ...args) {
  if (diagnostic.code === 6031) {//starting
    Object.values(fileRromiseMap).forEach(v => v.starttime = Date.now())
    return
  }
  if (diagnostic.code === 6032) {//change detected
    Object.values(fileRromiseMap).forEach(v => v.starttime = Date.now())
    return
  }
  //6193 -> found n errors but already "err"d in singular report (all that remain are good)

  if (diagnostic.code == 6194 || diagnostic.code === 6193) {
    [...Object.entries(fileRromiseMap)].forEach(([k, v]) => {
      if (v.timeadded < v.starttime!) {
        v.res(v.path)
        delete fileRromiseMap[k]
      }
    })
    return
  }
  console.info(diagnostic);
}

let watchProgram: WatchOfConfigFile<SemanticDiagnosticsBuilderProgram>

let schemaWatcher: JsonSchemaWatcher
export async function init() {
  const host = createWatchCompilerHost(tsconfig, {
    noEmit: true
  }, sys, createSemanticDiagnosticsBuilderProgram, reportDiagnostic, reportWatchStatusChanged)

  watchProgram = createWatchProgram(host)


  const proj = await create()

  schemaWatcher = new JsonSchemaWatcher(proj.createProgram())
  schemaWatcher.buildWatchGenerator({})


}

export function getWatcher() {
  return schemaWatcher
}

export async function getTypes(dts: string, mainType_else_laststatement: string | false, tracer: string) {

  return validateMorph(dts, tracer, {
    extractor: (pr, file) => {
      const program = pr
      const typeChecker = program.getTypeChecker()
      let statement: ts.Node = file.statements[file.statements.length - 1]
      if (ts.isModuleDeclaration(statement)) {
        const modStatements = statement.body
        if (modStatements && ts.isModuleBlock(modStatements)) {
          statement = modStatements.statements[modStatements.statements.length - 1]
        }
      }
      if (mainType_else_laststatement !== false) {
        const decl = file.getNamedDeclarations().get(mainType_else_laststatement);
        if (decl) {
          statement = decl[decl.length - 1]

        }

      }

      if (ts.isExpressionStatement(statement)) {
        statement = statement.expression
      }
      const typeDecl = typeChecker.getTypeAtLocation(statement)
      //as unknown as SourceFile
      schemaWatcher.addSourceFile(file)
      //as unknown as Type
      const generated = schemaWatcher?.getTypeDefinition(typeDecl);

      postfix(generated)
      return generated as ExtendedJsonSchema
    }
  })

}
