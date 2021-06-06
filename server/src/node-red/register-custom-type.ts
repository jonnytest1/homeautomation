import { Context, registerType, SuperNode } from './node-red-registration';
import type { RedFrontend, TypeRegistration } from './red-ui';
import { IsInterface, isString } from 'generic-type-guard';


declare const RED: RedFrontend;

const typeGuard = new IsInterface().withProperty("test", isString)

const validator = typeGuard.get()


const frontendType: () => TypeRegistration = () => ({
    category: 'custom',
    inputs: true,
    outputs: 2,
    defaults: {
        test: {
            value: 1,
            required: false,
            validate: RED.validators.number()
        }
    },
    oneditsave: function (...args) {
        debugger;
        console.log(this, ...args);
    },
    oneditprepare: function (...args: Array<unknown>) {
        RED.nodes.filterLinks({ target: { id: this.id } })
        RED.editor.validateNode(this)
        debugger;
        console.log(...args);
    }, label: () => {
        return 'Test12'
    }
})


class Test extends SuperNode {

    static frontendDefinition = frontendType

    static messageKeys = {
        common: {
            label: {
                name: "Name Abc"
            }
        }
    }

    prop = 1

    constructor(context: Context & { props: { key: string } }) {
        super(context);
        console.log(this.context().keys())

        this.on("input", data => {
            console.log(data);
            this.prop++;
            this.send([{
                payload: "test123",
                topic: "test123"
            }, {
                payload: "123testsdfsdfsdfsdfg",
                topic: "secondo utput"
            }]);
        })

    }
}



export async function registration() {
    registerType({
        moduleName: "smarthome",
        classRef: Test
    })

}