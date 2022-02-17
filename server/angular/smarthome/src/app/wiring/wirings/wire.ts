
import { FromJsonOptions } from '../serialisation';
import { Battery } from './battery';
import { Collection } from './collection';
import { Connection } from './connection';
import { RegisterOptions } from './interfaces/registration';
import { Parrallel } from './parrallel';
import { ParrallelWire } from './parrallel-wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Wire extends Collection {


  constructor(inConnection?: Connection) {
    super(inConnection, null);
    if (inConnection) {
      inConnection.connectedTo = this
    }
  }

  resistance = 0;

  outC: Connection


  public isViewWire = true
  getTotalResistance(f: Wiring, options: GetResistanceOptions): ResistanceReturn {
    return this.outC.getTotalResistance(this, options);
  }

  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {

    const connection = this.outC
    return connection.pushCurrent(options, this)
  }


  static connectNodes(...nodes: Array<Collection | Array<Collection> | ParrallelWire>) {
    let lastEl: Collection | ParrallelWire
    nodes.forEach(node => {
      if (node instanceof Array) {
        node = new Parrallel(...node);
      }

      if (lastEl) {

        if (lastEl instanceof ParrallelWire && !(node instanceof ParrallelWire)) {
          lastEl.newOutC(node.inC)
        } else if (node instanceof ParrallelWire && !(lastEl instanceof ParrallelWire)) {
          node.newInC(lastEl.outC)
        } else if (!(lastEl instanceof ParrallelWire) && !(node instanceof ParrallelWire)) {

          // lastEl.connectedTo = undefined
          Wire.connect(lastEl.outC, node.inC)
        }
      }
      // node.controlContainer = this
      // this.nodes.push(node)
      // this.connectFirst()
      lastEl = node;
    })
  }
  static connect(inC: Connection, outC: Connection) {
    let wire = inC.connectedTo
    if (!wire) {
      wire = new Wire(inC)
    }

    wire.connect(outC)
  }

  connect(other: Connection) {
    this.outC = other
    other.connectedTo = this
  }

  static at(outC: Connection) {
    const wire = new Wire()
    wire.connect(outC)
    return wire
  }


  register(options: RegisterOptions) {
    options.nodes.push(this)
    return this.outC.register({ ...options, from: this })
  }

  toJSON() {
    return {
      type: this.constructor.name,
      connectedWire: this.outC.parent instanceof Battery ? "BatteryRef" : this.outC.parent,
      ui: this.uiNode
    }
  }

  static fromJSON(json: any, context: FromJsonOptions): Wire {
    const wire = new Wire(context.inC)
    if (json.connectedWire == "BatteryRef") {
      return wire;
    }

    const connected = context.elementMap[json.connectedWire.type].fromJSON(json.connectedWire, { ...context, wire })

    return connected
  }
}