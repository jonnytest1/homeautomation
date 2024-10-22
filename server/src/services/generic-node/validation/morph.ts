import { CompilerError } from '../json-schema-type-util';
import type { Diagnostic } from 'typescript';
import { createProject, type Project, ts, ts as typescriptLib } from '@ts-morph/bootstrap';




declare module "@ts-morph/bootstrap" {

  namespace ts {
    interface SourceFile {
      getNamedDeclarations(): Map<string, Array<Node>>
    }
  }

}


let pr: Project
export async function create() {
  const project = await createProject({ useInMemoryFileSystem: true, });
  pr = project
  return project
}

type Args<T> = {
  extractor: (p: typescriptLib.Program, file: typescriptLib.SourceFile) => T
  preerror?: (diagnostics: ReadonlyArray<ts.Diagnostic>) => void
}
export function validateMorph<T>(file: string, tracername, args: Args<T>): T {
  const myClassFile = pr.createSourceFile(`src/${tracername}.ts`, file);

  const prog = pr.createProgram();
  const diagnostics = ts.getPreEmitDiagnostics(prog);
  try {
    if (diagnostics.length) {
      args.preerror?.(diagnostics)
      throw new CompilerError("typescript compiler error",
        diagnostics.map(d => ({
          ...d,
          file: d.file?.fileName
        }) as unknown as Diagnostic), prog)
    }
    return args.extractor(prog, myClassFile)
  } finally {
    pr.removeSourceFile(myClassFile)
  }
}