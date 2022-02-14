
import { ViewContainerRef, ViewRef } from '@angular/core';
import { FromJson, FromJsonOptions, JsonSerializer } from '../serialisation';
import { Collection } from './collection';
import { Connection } from './connection';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Battery extends Wiring {

    ampereSeconds: number;
    register(options: { nodes: any[]; until: Wiring; from?: any; }) {
        throw new Error('Method not implemented.');
    }
    resistance = 0.000;


    connectionProvide = new Connection(this, "bat_prov");

    connectionConsume = new Connection(this, "bat_cons");


    iterationTime: number

    currentCurrent_ampere: number

    maxAmpereSeconds: number

    enabled = false

    constructor(private voltage: number, ampereHours: number) {
        super();
        this.ampereSeconds = ampereHours * 60 * 60;
        this.maxAmpereSeconds = this.ampereSeconds
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


    toJSON() {
        return {
            prov: this.connectionProvide.connectedTo,
            voltage: this.voltage,
            ui: this.uiNode
        }
    }

    static fromJSON(fromJSON: jsonType, serialisationMap: Parameters<FromJson["fromJSON"]>[1], options: Partial<FromJsonOptions>): Battery {
        const battery = new Battery(fromJSON.voltage, 20);
        JsonSerializer.createUiRepresation(battery, fromJSON, options)
        if (serialisationMap[fromJSON.prov.type]) {
            const outC = serialisationMap[fromJSON.prov.type].fromJSON(fromJSON.prov, serialisationMap, {
                inC: battery.connectionProvide,
                ...options
            })
            if (outC) {
                outC.connect(battery.connectionConsume)
            }
        } else {
            throw new Error("missing serialisation for " + fromJSON.prov.type)
        }
        return battery

    }
}

type jsonType = { [K in keyof ReturnType<(Battery)["toJSON"]>]: any }