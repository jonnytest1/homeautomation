
import { generateDtsFromSchema, jsonSchemaFromDts } from './json-schema-type-util'
import { ScriptTarget, createProgram, isTypeAliasDeclaration, TypeFormatFlags } from "typescript"
import { writeFileSync } from "fs"
import { join } from "path"
declare module "typescript" {
  export interface SourceFile {
    getNamedDeclarations(): Map<string, Array<Node>>
  }

}


describe("type operations", () => {
  it("collapses types", () => {


    const modPAth = join(__dirname, "ts", "module.ts")
    writeFileSync(modPAth, `
       export  type a={test:123};
        export type b=string;`)
    const path1 = join(__dirname, "ts", "text.ts")
    writeFileSync(path1, `
          type result=string|string;
          `)

    // compilerHost
    const p = createProgram([path1, modPAth], { declaration: true, target: ScriptTarget.Latest },)

    const typeChecker = p.getTypeChecker();

    const file = p.getSourceFiles().find(f => f.fileName.endsWith("text.ts"))

    const mainStatement = file?.getNamedDeclarations().get("result")?.[0]
    if (mainStatement && isTypeAliasDeclaration(mainStatement)) {
      const typenode = typeChecker.getTypeFromTypeNode(mainStatement.type)

      //const dts = toDTs(typenode)
      // debugger
      // const resultType = typeChecker.getTypeAtLocation(mainStatement)
      const typeFlag = TypeFormatFlags
      const typeAsString = typeChecker.typeToString(typenode, file, typeFlag.InTypeAlias)

      console.log(typeAsString);

      debugger
    } else {
      throw new Error("invalid string")
    }

  })



  it("convert d.ts to json schema", async () => {


    const schema = jsonSchemaFromDts(`
     type RootInterface ={ type: "release", key: string } | {type: "press", key: string }
    `, "RootInterface")
    debugger
  })

  it("schema to dts", async () => {


    const schema = await generateDtsFromSchema({
      "type": "string"
    })
    expect(schema).toBe("export type Main = string;")

    expect(await generateDtsFromSchema({
      "type": "string",
      enum: ["on", "off"]
    }))
      .toBe(`export type Main = "on" | "off";`)

    debugger
    console.log(schema)
  })
})