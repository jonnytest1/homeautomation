
import { FromJsonOptions, JsonSerializer } from '../serialisation';
import { Collection } from './collection';
import { Connection } from './connection';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Battery extends Collection {


    ampereSeconds: number;

    resistance = 0.000;

    iterationTime: number

    currentCurrent_ampere: number

    maxAmpereSeconds: number

    enabled = false



    constructor(private voltage: number, ampereHours: number) {
        super(null, null);
        this.outC = new Connection(this, "bat_prov")
        this.inC = new Connection(this, "bat_cons")
        this.ampereSeconds = ampereHours * 60 * 60;
        this.maxAmpereSeconds = this.ampereSeconds

        //this.controlContainer = new SerialConnected()

        //Wire.connect(this.controlContainer.outC, this.inC)
    }

    /* connectTo(serial: SerialConnected) {
         Wire.connect(this.outC, serial.inC)
     }*/


    getTotalResistance(from: Connection, options: GetResistanceOptions): number {
        if (!from) {
            return this.outC.getTotalResistance(this, options)
        } else {
            return 0
        }

    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (!from) {
            return this.outC.pushCurrent(options, this)
        } else {
            if (options.voltage > 0.001) {
                throw new Error("voltage should be 0 right here")
            }
            return {
                voltage: 0,
                remainingAmpereHours: this.ampereSeconds,
                current: 0
            }
        }
    }


    checkContent(deltaSeconds: number) {
        let resistance;
        if (this.enabled) {
            resistance = this.getTotalResistance(null, {})
        } else {
            resistance = NaN
        }

        if (isNaN(resistance) || this.ampereSeconds == 0) {
            this.currentCurrent_ampere = 0
            this.pushCurrent({
                current: 0,
                voltage: 0,
                deltaSeconds: deltaSeconds,
                resistance: 0
            }, null)
        } else {
            this.currentCurrent_ampere = this.voltage / resistance

            const result = this.pushCurrent({
                current: this.currentCurrent_ampere,
                voltage: this.voltage,
                deltaSeconds: deltaSeconds,
                resistance: 0
            }, null)
            const ampereSeconds = this.currentCurrent_ampere * deltaSeconds
            if (ampereSeconds < 0) {
                debugger
            }
            this.ampereSeconds = Math.max(this.ampereSeconds - ampereSeconds, 0)
        }


        //console.log(this.ampereHours)
        //this.connectionConsume.connectedTo.getTotalResistance(null)
        //this.connectionConsume.connectedTo?.pullCurrent({ maxVoltage: this.voltage, maxAmpere: Math.min(this.amperePerFrame, this.watt) })
    }

    public getProjectedDurationMinutes(): number {
        const remainingAmpereSeconds = this.ampereSeconds * 60 * 60
        const remainingSeconds = remainingAmpereSeconds / this.currentCurrent_ampere
        return remainingSeconds / (60 * 60)
    }


    register(options: { nodes: any[]; until: Wiring; from?: any; }) {
        if (options.from == this.inC) {
            options.nodes.push(this)
            return;
        }
        options.nodes.push(this)
        this.outC?.register(options)
    }
    getStructure() {
        const nodes = []
        this.register({ nodes, until: this.inC, from: this });
        return nodes;
    }
    toJSON() {
        return {
            prov: this.outC.connectedTo,
            voltage: this.voltage,
            ui: this.uiNode,
            enabled: this.enabled,
            charge: this.ampereSeconds / (60 * 60),
            maxAmpere: this.maxAmpereSeconds
        }
    }

    static fromJSON(fromJSON: jsonType, options: FromJsonOptions): Battery {

        const battery = new Battery(fromJSON.voltage, fromJSON.charge ?? 0.001);
        battery.enabled = fromJSON.enabled
        battery.maxAmpereSeconds = fromJSON.maxAmpere ?? fromJSON.charge ?? 0.0001
        JsonSerializer.createUiRepresation(battery, fromJSON, options)
        if (options.elementMap[fromJSON.prov.type]) {
            const outC = options.elementMap[fromJSON.prov.type].fromJSON(fromJSON.prov, {
                inC: battery.outC,
                ...options
            })
            if (outC) {
                outC.connect(battery.inC)
            }
        } else {
            throw new Error("missing serialisation for " + fromJSON.prov.type)
        }
        return battery

    }
}

type jsonType = { [K in keyof ReturnType<(Battery)["toJSON"]>]: any }