import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import { Battery } from './battery';
import { Resistor } from './resistor';
import type { Wire } from './wire';
import type { CurrentOption, Wiring, CurrentCurrent } from './wiring.a';

export class Transformator extends Resistor {
  constructor() {
    super(5);
    this.providingBattery.enabled = true;
  }

  providingBattery = new Battery(null, Infinity);

  turnsRatio = 200 / 100;  // 200 rounds on this side vs 100 on the receiving



  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    const batteryVoltage = options.voltage / this.turnsRatio;
    const power = options.current * options.voltage;
    // const current = power / batteryVoltage;
    this.providingBattery.voltage = batteryVoltage;
    this.providingBattery.checkContent(options.deltaSeconds);

    return super.pushCurrent({
      ...options,
      current: 0,
      voltage: 0,
    }, from);
  }


  applytoJson(json: Record<string, any>): void {
    super.applytoJson(json);
    json.providingBattery = this.providingBattery;
    json.turnRatio = this.turnsRatio;
  }


  readFromJson(json: Record<string, any>): void {
    super.readFromJson(json)
    this.turnsRatio = json.turnRatio;
  }

  static fromJSON(json: any, context: FromJsonOptions): Wire {
    const self = new Transformator();
    self.readFromJson(json)
    if (context.wire) {
      context.wire.connect(self.inC);
    }
    JsonSerializer.createUiRepresation(self, json, context);
    self.providingBattery = context.elementMap[json.providingBattery.type].fromJSON(json.providingBattery,
      { ...context, wire: undefined, inC: undefined }) as unknown as Battery;

    const connected = context.elementMap[json.outC.type].fromJSON(json.outC, { ...context, inC: self.outC });

    return connected;
  }

}
