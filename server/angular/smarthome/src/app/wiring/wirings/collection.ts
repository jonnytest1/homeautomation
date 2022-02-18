

import type { Connection } from './connection';
import type { RegisterOptions } from './interfaces/registration';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn } from './wiring.a';
import { Wiring } from './wiring.a';


export class Collection extends Wiring {


  constructor(public inC: Connection, public outC: Connection) {
    super();
    this['id'] = Math.random();
  }


  register(options: RegisterOptions) {
    if (options.from == this.outC) {
      options.nodes.push(this);
      return this.outC.register({ ...options, from: this });
    }
    options.nodes.push(this);
    return this.inC.register({ ...options, from: this });
  }

  applytoJson(json: Record<string, any>) {
    // to implement
  }

  toJSON(): any {
    const jsonObj = {
      type: this.constructor.name
    };
    this.applytoJson(jsonObj);
    return jsonObj;
  }

  getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn {
    throw new Error('Method not implemented.');
  }
  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    throw new Error('Method not implemented.');
  }

  mockUiNode() {
    import('../wiring-ui/mock-ui').then((mui) => {
      this.uiNode = new mui.MockUiNode(this, null);
    });
  }
}
