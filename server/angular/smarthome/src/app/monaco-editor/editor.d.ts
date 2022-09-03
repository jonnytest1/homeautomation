
//import type { createTypeScriptSandbox as cr, Sandbox } from "@typescript/sandbox"


export interface Decoration {
  options: {
    className?: string
    inlineClassName?: string
  }

  range: MonacoRange
}

interface Position {
  column: number
  lineNumber: number
}

export interface MonacoModel {
  getAllDecorations(): Array<Decoration>

  getValue(): string
  setValue(val: string): void
  getPositionAt(index: number)

  dispose(): void
}

export interface Range {
  newLength: number,
  span?: {
    start: number,
    length: number
  }
}

export interface Editor {
  deltaDecorations(dec: Array<Decoration>, newDecorations: Array<Decoration>): Array<Decoration>


  onDidChangeModelDecorations(cb: (e) => void | Promise<void>): void


  focus()
}

export interface AST {
  text: string
  getText(): string
  pos: number
  end: number
  arguments?: Array<AST>
  expression: AST
  kind: 198 | 78 | 200 | 201
  getChildren(): Array<AST>
  update(val?: string, range?: Range)
}

export type SandBox = {
  getModel(): MonacoModel
  editor: Editor
  updateCompilerSettings(params)

  getAST(): Promise<AST>
  getRunnableJS(): Promise<string>
}
type createTypeScriptSandbox = any


interface MonacoRange {
  endColumn: number
  endLineNumber: number
  startColumn: number
  startLineNumber: number
}


export interface MonacoGlobal {
  editor: {
    getModels(): Array<MonacoModel>

    defineTheme(theme: string, options)
  }

  Range: new (starLinbe: number, startColun: number, endLine: number, endColumn: number) => MonacoRange;

  languages: {
    typescript: {
      getTypeScriptWorker(): Promise<unknown>
      typescriptDefaults
      ScriptTarget
      ModuleResolutionKind
      ModuleKind
    }
  }
}


export interface SandboxFactory {
  createTypeScriptSandbox(sandboxConfig: {
    text: any;
    domID: string;
    monacoSettings: {
      theme: string;
      lineHeight: number;
      readOnly: boolean
    }
  },
    main: Main,
    arg2: any): SandBox

}

export interface Main {
  __typebreak
}