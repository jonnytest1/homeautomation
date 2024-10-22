import { ts } from '@ts-morph/bootstrap';
import { Args, JsonSchemaGenerator, SymbolRef, getDefaultArgs } from 'typescript-json-schema';
import type { ExtendedJsonSchema } from 'json-schema-merger';
import { relative } from "path"

export class JsonSchemaWatcher {

  typeChecker = this.program.getTypeChecker()

  symbols: Array<SymbolRef> = []

  allTypes: Record<string, ts.Type> = {}

  userSymbols: Record<string, ts.Symbol> = {}

  inheritingTypes: Record<string, Array<string>> = {}
  workingDir: string;
  settings: Args;
  constructor(private program: ts.Program) {

    this.workingDir = this.program.getCurrentDirectory();
  }

  isUserFile(file: ts.SourceFile) {
    return !file.fileName.includes("node_modules")
  }

  buildWatchGenerator(args: Partial<Args>) {
    this.settings = getDefaultArgs()
    for (const pref in args) {
      if (args.hasOwnProperty(pref)) {
        this.settings[pref] = args[pref];
      }
    }
    this.program.getSourceFiles().forEach((sourceFile: ts.SourceFile & { relativePath?: string }) => {
      this.addSourceFile(sourceFile)
      const relativePath = relative(this.workingDir, sourceFile.fileName);
      sourceFile.relativePath = relativePath
      //this.inspect(sourceFile, sourceFile, this.typeChecker);
    });
    return this.getSchemaGenerator()
  }

  inspect(node: ts.Node, sourceFile: ts.SourceFile & { relativePath?: string }, tc: ts.TypeChecker) {
    if (node.kind === ts.SyntaxKind.ClassDeclaration ||
      node.kind === ts.SyntaxKind.InterfaceDeclaration ||
      node.kind === ts.SyntaxKind.EnumDeclaration ||
      node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
      //@ts-ignore
      const symbol = node.symbol as TSSymbol;
      const nodeType = tc.getTypeAtLocation(node);
      const fullyQualifiedName = tc.getFullyQualifiedName(symbol);
      const typeName = fullyQualifiedName.replace(/".*"\./, "");

      const name_1 = typeName;
      this.symbols.push({ name: name_1, typeName: typeName, fullyQualifiedName: fullyQualifiedName, symbol: symbol });
      if (!this.userSymbols[name_1]) {
        this.allTypes[name_1] = nodeType;
      }
      if (this.isUserFile(sourceFile)) {
        this.userSymbols[name_1] = symbol;
      }
      const baseTypes = nodeType.getBaseTypes() || [];
      baseTypes.forEach((baseType) => {
        const baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        if (!this.inheritingTypes[baseName]) {
          this.inheritingTypes[baseName] = [];
        }
        this.inheritingTypes[baseName].push(name_1);
      });
    }
    else {
      ts.forEachChild(node, (n) => this.inspect(n, sourceFile, tc));
    }
  }


  addSourceFile(sourceFile: ts.SourceFile & { relativePath?: string }, tc = this.typeChecker) {
    const relativePath = relative(this.workingDir, sourceFile.fileName);
    sourceFile.relativePath = relativePath
    this.inspect(sourceFile, sourceFile, tc);
  }

  getSchemaGenerator() {
    return new JsonSchemaGenerator(this.symbols, this.allTypes as any, this.userSymbols as any, this.inheritingTypes, this.typeChecker as any, this.settings);
  }
  getTypeDefinition(typDecl: ts.Type) {
    const schemaGEn = this.getSchemaGenerator()
    //@ts-ignore
    const schema: ExtendedJsonSchema = schemaGEn.getTypeDefinition(typDecl, false, undefined, undefined, undefined, undefined, true)
    //@ts-ignore
    schema.definitions = schemaGEn?.reffedDefinitions

    return schema
  }

  copy(withProgram: ts.Program) {
    const copyWatcher = new JsonSchemaWatcher(withProgram)
    copyWatcher.allTypes = { ...this.allTypes }
    copyWatcher.userSymbols = { ...this.userSymbols }
    copyWatcher.inheritingTypes = { ...this.inheritingTypes }
    copyWatcher.symbols = [...this.symbols]

    return copyWatcher;
  }



  /*  getTypeFromSource() {
      const name = "test.ts";
      const source = createSourceFile(name, `
             type Test = {
      abc: Data
    }
    type Other={
      abc:123,
      def:Test
    }
  
    type Data = {
      key: string,
      abc:Other
    } `,
        ScriptTarget.ES2022)
  
      const host = createCompilerHost({
  
      })
      const program = createProgram([name], {
        typeRoots: [],
        noLib: true
      }, {
        ...host,
        getSourceFile(file, ...args) {
          if (file === name) {
            return source
          }
          return host.getSourceFile(file, ...args)
        }
      })
      const emitResults = getPreEmitDiagnostics(program)
      if (emitResults.length) {
        const jsonSafeResults = emitResults
          .map(r => ({ ...r, file: null }))
        //throw new CompilerError("typescript compiler error while generating schema", jsonSafeResults)
      }
      const cp = this.copy(program)
      //this.typeChecker.
      cp.addSourceFile(source)
      const st = source.getNamedDeclarations().get("Data")?.[0]
      const typeDecl = program.getTypeChecker().getTypeAtLocation(st as any)
      const schema = cp.getTypeDefinition(typeDecl)
      console.log(schema)
    }
  */
}