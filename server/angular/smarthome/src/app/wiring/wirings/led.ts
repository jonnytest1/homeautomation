
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import { noConnection } from './resistance-return';
import { Resistor } from './resistor';
import type { Wire } from './wire';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class LED extends Resistor {
  brightness: number = 0;

  blown = false

  readonly maxVoltageDrop = 2.4


  constructor() {
    super(5)
  }

  getTotalResistance(from: any, options: GetResistanceOptions): ResistanceReturn {
    if (this.blown) {
      return noConnection()
    }
    return super.getTotalResistance(from, options)
  }

  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    const returnCurrent = super.pushCurrent(options, from)
    if (options.current > 0) {
      if (this.voltageDrop > this.maxVoltageDrop) {
        this.blown = true;
        return
      }
      this.brightness = this.voltageDrop * 100 / this.maxVoltageDrop
    } else {
      this.brightness = 0
    }

    return returnCurrent
  }

  static fromJSON(json: any, context: FromJsonOptions): Wire {
    const self = new LED();
    self.uuid = json.uuid
    JsonSerializer.createUiRepresation(self, json, context)
    if (context.wire) {
      context.wire.connect(self.inC)
    }
    const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC })

    return connected



  }
}