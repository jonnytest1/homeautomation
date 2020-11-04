

const tsc = require('node-typescript-compiler')
import { promises } from "fs"
import { convertToOS, writeFileDir } from './file';
import { join } from "path"
import { logKibana } from './log';

let responseINterface
promises.readFile(join(__dirname, "../models/connection-response.d.ts"), "utf8").
    then((content) => {
        responseINterface = content
        writeFileDir("/tmp/tsc/transform/connection-response.d.ts", responseINterface)
    });



export class TscCompiler {



    readonly args = {
        "module": "commonjs",
        "moduleResolution": "node",
        /* "lib": [
             "es6"
         ]*/
    }
    async prepare(transformation: string) {

        const tr = transformation.trim()
        const statements = tr.split(/;/g);

        let index = statements.length - 1;
        if (!statements[index].trim()) {
            index--
        }
        let lastStatement = statements[index];
        let brackets = 0;
        for (let i = lastStatement.length - 1; i > -1; i--) {
            if (lastStatement[i] === ")") {
                brackets++;
            } else if (lastStatement[i] == "(") {
                brackets--;
            }
            if (brackets == 0) {
                const before = lastStatement.substr(0, i);
                const after = lastStatement.substr(i, lastStatement.length);
                lastStatement = `${before}const transoframtionAssignementTestVariable:TransformationResponse=${after}`
                break;
            }
        }

        statements[index] = lastStatement;
        const trStr = statements.join(';')

        const transofrmationFile = `import { TransformationResponse } from './connection-response';\n
${trStr}`

        await writeFileDir("/tmp/tsc/transform/transform.ts", transofrmationFile)
    }


    async compile() {
        try {
            await tsc.compile(this.args, [convertToOS("/tmp/tsc/transform/transform.ts")], {
                spawn_options: {
                    env: {
                        DEBUG: false
                    }
                }
            })///tmp/tsc/transform/transform.ts
        } catch (e) {
            if (e.reason.includes('Spawn: got event "exit" with error code "2"')) {
                const output = e.stdout;


                const lines = output.split("\n")
                    .map(str => str.trim())

                const errors: Array<{ pos, reason }> = []

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes("transform.ts")) {
                        const parts = lines[i].split('transform.ts(')[1].split('):');
                        const pos = parts[0];
                        errors.push({
                            pos: {
                                row: pos.split(",")[0] - 2,
                                character: +pos.split(",")[1]
                            },
                            reason: parts[1].split(': ')[1].replace(/\./, '')
                        })
                    } else {
                        errors[errors.length - 1].reason += `\n\t${lines[i]}`;
                    }
                }
                return errors;
            } else {
                logKibana("ERROR", { message: "unhandled error" }, e)
            }
        }
    }
}