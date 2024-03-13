
import type { FromJsonOptions } from '../serialisation';
import { JsonSerializer } from '../serialisation';
import { Collection } from './collection';
import { Connection } from './connection';
import type { RegisterOptions } from './interfaces/registration';
import { noResistance } from './resistance-return';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from './wiring.a';

export class Battery extends Collection {

  constructor(public voltage: number | null, ampereHours: number) {
    super(null, null);
    this.outC = new Connection(this, 'bat_prov');
    this.inC = new Connection(this, 'bat_cons');
    this.ampereSeconds = ampereHours * 60 * 60;
    this.maxAmpereSeconds = this.ampereSeconds;

    // this.controlContainer = new SerialConnected()

    // Wire.connect(this.controlContainer.outC, this.inC)
  }


  ampereSeconds: number;

  networkResistance = 0.000;

  iterationTime: number;

  currentCurrent_ampere: number;

  maxAmpereSeconds: number;

  enabled = false;

  getTotalResistance(from: Connection, options: GetResistanceOptions): ResistanceReturn {
    if (!from) {
      return this.outC.getTotalResistance(this, options);
    } else {
      return noResistance();
    }

  }

  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    if (!from) {
      return this.outC.pushCurrent(options, this);
    } else {
      if (options.voltage > 0.001) {
        throw new Error('voltage should be 0 right here but was ' + options.voltage.toPrecision(3));
      }
      return {
        voltage: 0,
        remainingAmpereHours: this.ampereSeconds,
        current: 0,
        afterBlockCurrent: []
      };
    }
  }


  checkContent(deltaSeconds: number) {
    if (this.enabled) {
      this.networkResistance = this.getTotalResistance(null, {}).resistance;
    } else {
      this.networkResistance = NaN;
    }

    if (isNaN(this.networkResistance) || this.ampereSeconds == 0) {
      this.currentCurrent_ampere = 0;
      this.pushCurrent({
        current: 0,
        voltage: 0,
        deltaSeconds: deltaSeconds,
        resistance: 0,
        triggerTimestamp: Date.now()
      }, null);
    } else {
      this.currentCurrent_ampere = this.voltage / this.networkResistance;
      this.currentCurrent_ampere = Math.min(this.maxAmpereSeconds, this.currentCurrent_ampere);
      const result = this.pushCurrent({
        current: this.currentCurrent_ampere,
        voltage: this.voltage,
        deltaSeconds: deltaSeconds,
        resistance: 0,
        triggerTimestamp: Date.now()
      }, null);
      const ampereSeconds = this.currentCurrent_ampere * deltaSeconds;

      this.ampereSeconds = Math.max(this.ampereSeconds - ampereSeconds, 0);
    }

  }

  public getProjectedDurationMinutes(): number {
    const remainingAmpereSeconds = this.ampereSeconds * 60 * 60;
    const remainingSeconds = remainingAmpereSeconds / this.currentCurrent_ampere;
    return remainingSeconds / (60 * 60);
  }


  register(options: RegisterOptions) {
    if (options.from == this.inC) {
      options.nodes.push(this);
      return;
    }
    options.nodes.push(this);
    this.outC?.register(options);
  }
  getStructure() {
    const nodes = [];
    this.register({ nodes, until: this.inC, from: this, parrallelLevel: 0, registrationTimestamp: Date.now() });
    return nodes;
  }
  toJSON(key?) {

    if (key == "connectedWire") {
      return "BatteryRef"
    }
    return {
      type: this.constructor.name,
      prov: this.outC.connectedTo,
      voltage: this.voltage,
      ui: this.uiNode,
      enabled: this.enabled,
      charge: this.ampereSeconds === Infinity ? "Infinity" : this.ampereSeconds / (60 * 60),
      maxAmpere: this.maxAmpereSeconds === Infinity ? "Infinity" : this.maxAmpereSeconds
    };
  }


  static fromJSON(fromJSON: jsonType, options: FromJsonOptions): Battery {
    if (typeof fromJSON !== "string") {

      if (fromJSON.charge == "Infinity") {
        fromJSON.charge = Infinity
      }
      if (fromJSON.maxAmpere == "Infinity") {
        fromJSON.maxAmpere = Infinity
      }
      debugger
      const battery = new Battery(fromJSON.voltage, +fromJSON.charge ?? 0.001);
      battery.enabled = fromJSON.enabled;
      battery.maxAmpereSeconds = +fromJSON.maxAmpere ?? +fromJSON.charge ?? 0.0001;
      JsonSerializer.createUiRepresation(battery, fromJSON, options);

      const prov = fromJSON.prov
      if ("type" in prov) {
        const provType = prov.type as string
        if (options.elementMap[provType]) {
          const outC = options.elementMap[provType].fromJSON(prov, {
            ...options,
            inC: battery.outC,
          });
          if (outC) {
            outC.connect(battery.inC);
          }
        } else {
          throw new Error('missing serialisation for ' + prov);
        }

      } else {
        throw new Error('missing serialisation for ' + prov);
      }

      return battery;
    }

  }
}

type jsonType = ReturnType<(Battery)['toJSON']>
