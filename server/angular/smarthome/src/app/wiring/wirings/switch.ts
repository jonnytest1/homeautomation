
import { FromJsonOptions, JsonSerializer } from '../serialisation'
import { Connection } from './connection'
import { Resistor } from "./resistor"
import { Wire } from './wire'
import { GetResistanceOptions } from './wiring.a'
export class Switch extends Resistor {



    enabled = false
    public controlRef: string

    negatedOutC = new Connection(this, "switch_out_negated")
    constructor() {
        super(0)
    }
    getTotalResistance(from: any, options: GetResistanceOptions): number {
        if (this.enabled) {
            return super.getTotalResistance(from, options)
        }
        return NaN
    }

    toJSON(): any {
        return {
            type: this.constructor.name,
            resistance: this.resistance,
            controlRef: this.controlRef,
            outC: this.outC.connectedTo,
            ui: this.uiNode,
            enabled: this.enabled,
        }
    }
    static fromJSON(json: any, context: FromJsonOptions): Wire {
        const self = new Switch();
        self.enabled = json.enabled ?? false
        if (context.wire) {
            context.wire.connect(self.inC)
        }
        if (json.controlRef) {
            context.controlRefs[json.controlRef] = self
        } else {
            JsonSerializer.createUiRepresation(self, json, context)
        }
        const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC })
        if (json.negatedOutC) {
            context.elementMap[json.negatedOutC.type].fromJSON(json.negatedOutC, { ...context, inC: self.negatedOutC })
        }
        //
        return connected
    }

}