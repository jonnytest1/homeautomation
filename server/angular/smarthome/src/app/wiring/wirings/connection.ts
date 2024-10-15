import type { RegisterOptions } from './interfaces/registration';
import type { ParrallelWire } from './parrallel-wire';
import { noConnection } from './resistance-return';
import { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Connection implements Wiring {


  constructor(public parent: Wiring, public id: string) {}


  resistance: number;


  connectedTo?: Wire | ParrallelWire;

  getTotalResistance(from: Wiring | null, options: GetResistanceOptions): ResistanceReturn {
    options.addStep(this)
    let target = this.parent;

    if (from === this.parent) {
      target = this.connectedTo;

    }
    if (target == undefined) {
      return noConnection(this);
    }
    return target.getTotalResistance(this, options);
  }

  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    let target = this.parent;

    if (from === this.parent) {
      target = this.connectedTo;

    }
    if (target == undefined) {
      return;
    }
    return target.pushCurrent(options, this);

  }
  register(options: RegisterOptions) {
    options.nodes.push({ name: "Connection" });
    let target = this.parent;

    if (options.from === this.parent) {
      target = this.connectedTo;

    }
    if (target === undefined) {
      return;
    }
    target.register({ ...options, from: this });
  }

  connectTo(other: Connection) {
    Wire.connect(this, other);
  }
}
