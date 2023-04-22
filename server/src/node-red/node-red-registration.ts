


import type { TypeRegistration } from './red-ui';
import { globalSCript } from './glboal-script';
import * as RED from "node-red";
const registry = require("@node-red/registry/lib/registry.js")

const registeredModules = {

}

export interface Context {
    type: string
}


interface TypeOptions {
    moduleName,
    classRef: typeof SuperNode & {
        frontendDefinition: () => TypeRegistration
        messageKeys?: Record<string, unknown>
    }
}



const i18n = RED.runtime._.i18n;
const _nodes = (RED.runtime._.nodes as any);

interface DataHolder {
    get: (key, st?, callback?) => unknown
    keys: (st?, callback?) => Array<string>

    set(key, value, st?, callback?): void
}

interface SendData {
    topic: string, payload: string
}


export abstract class SuperNode {

    declare send: (data: SendData | Array<SendData>) => void
    declare on: (eventType: "close" | "input", callback: (e) => void) => void

    declare warn: (warning: "string") => void

    declare status: (status: string | number | {
        fill?: "red" | "green" | "yellow" | "blue" | "grey",
        shape?: "ring" | "dot",
        text?: string
    }) => void

    declare context: () => DataHolder & {
        global: DataHolder
        flow: DataHolder
    }

    constructor(config: Context) {
        _nodes.createNode(this, config);

    }
}

function stringify(object) {
    if (typeof object == "string") {
        return `"${object}"`
    } else if (typeof object == "number") {
        return object
    } else if (typeof object == "boolean") {
        return object
    } else if (typeof object == "function") {
        return object.toString();
    } else {
        let str = "{"
        let hasValue = false
        for (const key in object) {
            str += `${hasValue ? ',' : ''}\n"${key}":${stringify(object[key])}`
            hasValue = true
        }
        str += "\n}"
        return str;
    }
}


export async function registerType(options: TypeOptions) {

    const moduleNamE = "smarthome"
    const typeName = options.classRef.name

    const defaultsFirstKEy = "test"
    if (!registeredModules[options.moduleName]) {

        const registrationString = stringify(options.classRef.frontendDefinition)
        console.log(registrationString)
        const helpScript = `<script>
                                if(!window.registeredLinks){
                                    window.registeredLinks=true;
                                   (${stringify(globalSCript)})();
                                }
                                const typeOpts=(${registrationString})()
                                RED.nodes.registerType('${typeName}',typeOpts)

                                const formScr=document.createElement("script");
                                formScr.setAttribute("data-template-name","${typeName}")
                                debugger;
                                formScr.type="text/html" 
                                formScr.innerHTML= Object.keys(typeOpts.defaults).map(key=>{
                                    return \`
                                        <div class="form-row">
                                            <label for="node-input-\${key}"><i class="fa fa-tag"></i> <span data-i18n="common.label.name"></span></label>
                                            <input type="text" id="node-input-\${key}" data-i18n="[placeholder]common.label.name">
                                        </div>
                                    \`;
                                })
                                .join("\\\n")
                                
                                document.body.appendChild(formScr)
                            </script>`

        registeredModules[options.moduleName] = {
            name: moduleNamE,
            id: moduleNamE,
            nodes: {
                [typeName]: {
                    enabled: true,
                    help: {
                        de: helpScript,
                        ["de-DE"]: helpScript
                    },
                    config: `
                       
                    `, //config html
                    module: moduleNamE, // referenced by frontend
                    name: typeName,
                    id: moduleNamE + "/" + typeName,
                    types: [typeName],

                }
            }
        }
        await registry.addModule(registeredModules[options.moduleName])

    }
    if (options.classRef.messageKeys) {
        await (i18n as any).i.addResourceBundle("de", options.moduleName + `/${typeName}`, options.classRef.messageKeys)
    }
    await _nodes.registerType(moduleNamE, typeName, options.classRef, undefined);
}
