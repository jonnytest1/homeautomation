
import { Connection } from './connection';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Battery extends Wiring {
    resistance = 0.000;


    connectionProvide = new Connection(this, "bat_prov");

    connectionConsume = new Connection(this, "bat_cons");


    iterationTime: number

    currentCurrent_ampere: number

    maxAmpereHours: number

    constructor(private voltage: number, public ampereHours: number) {
        super();
        this.maxAmpereHours = this.ampereHours
    }


    getTotalResistance(from: Connection, options: GetResistanceOptions): number {
        if (!from) {
            return this.connectionProvide.getTotalResistance(this, options)
        } else {
            return 0
        }

    }

    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (!from) {
            return this.connectionProvide.pushCurrent(options, this)
        } else {
            if (options.voltage > 0.001) {
                throw new Error("voltage should be 0 right here")
            }
            return {
                voltage: 0,
                remainingAmpereHours: this.ampereHours,
                current: 0
            }
        }
    }


    checkContent(deltaSeconds: number) {
        const resistance = this.getTotalResistance(null, {})
        if (isNaN(resistance)) {
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
            this.ampereHours -= ampereSeconds / (60 * 60)
        }


        //console.log(this.ampereHours)
        //this.connectionConsume.connectedTo.getTotalResistance(null)
        //this.connectionConsume.connectedTo?.pullCurrent({ maxVoltage: this.voltage, maxAmpere: Math.min(this.amperePerFrame, this.watt) })
    }

    public getProjectedDurationMinutes(): number {
        const remainingAmpereSeconds = this.ampereHours * 60 * 60
        const remainingSeconds = remainingAmpereSeconds / this.currentCurrent_ampere
        return remainingSeconds / (60 * 60)
    }
}