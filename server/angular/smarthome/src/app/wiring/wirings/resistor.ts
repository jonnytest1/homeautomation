
import { FromJsonOptions, JsonSerializer } from '../serialisation';
import { UINode } from '../wiring-ui/ui-node.a';
import { Collection } from './collection';
import { Connection } from './connection';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';
import { v4 } from "uuid"
import { RegisterOptions } from './interfaces/registration';

export class Resistor extends Collection implements Wiring {


  uiNode?: UINode;

  voltageDrop: number
  incomingCurrent: CurrentOption;

  uuid = v4()
  constructor(public resistance: number) {
    super(null, null)
    this.inC = new Connection(this, "res_in")
    this.outC = new Connection(this, "res_out")
  }
  getTotalResistance(from, options: GetResistanceOptions): ResistanceReturn {
    const afterResistance = this.outC.getTotalResistance(this, options);
    return { ...afterResistance, resistance: afterResistance.resistance + this.resistance }
  }


  evaluateFunction(options: CurrentOption) {
    // to implement
  }

  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    this.incomingCurrent = { ...options }

    this.voltageDrop = (options.current * this.resistance)
    this.evaluateFunction(options)
    return this.outC.pushCurrent({
      ...options,
      voltage: options.voltage - this.voltageDrop
    }, this);
  }
  register(options: RegisterOptions) {
    options.nodes.push(this)
    return this.outC.register({ ...options, from: this })
  }

  toJSON(): any {
    return {
      type: this.constructor.name,
      resistance: this.resistance,
      outC: this.outC.connectedTo,
      ui: this.uiNode,
      uuid: this.uuid
    }
  }

  static fromJSON(json: any, context: FromJsonOptions): Wire {
    const self = new Resistor(json.resistance);
    self.uuid = json.uuid
    if (context.wire) {
      context.wire.connect(self.inC)
    }
    JsonSerializer.createUiRepresation(self, json, context)
    const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC })

    return connected
  }
}