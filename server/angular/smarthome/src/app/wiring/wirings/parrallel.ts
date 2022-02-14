
import { FromJson, FromJsonOptions } from '../serialisation';
import { Collection } from './collection';
import { Connection } from './connection';
import { ControlCollection } from './control-collection.a';
import { Resistor } from './resistor';
import { SerialConnected } from './serial-block';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class Parrallel extends ControlCollection implements Wiring {
    resistance: number;

    lanes: Array<Collection>


    containers: Array<Collection & Wiring>

    voltageDrop?: number
    wireProv: Wire;
    wireRec: Wire;
    inVoltage: number;
    restCurrent: CurrentCurrent;
    constructor(...containers: Array<Collection & Wiring>) {
        super(null, null);
        this.inC = new Connection(this, "par_in");
        this.outC = new Connection(this, "par_out");

        this.wireProv = new Wire(this.inC);
        this.wireRec = Wire.at(this.outC);

        for (const component of containers) {
            this.wireProv.connectedWire = component.inC
            component.outC.connectedTo = this.wireRec
        }
        this.containers = containers


    }

    getTotalResistance(from: Wiring, options: GetResistanceOptions): number {
        if (from == this.outC) {
            if (options.forParrallel) {
                if (options.forParrallel === 1) {
                    return 0;
                }
                return this.outC.getTotalResistance(this, { ...options, forParrallel: options.forParrallel - 1 })
            }
            return this.outC.getTotalResistance(this, { ...options })
        } else if (typeof options.forParrallel != "undefined") {
            debugger;
        }
        let resistancetotal = 0
        this.containers.forEach(res => {
            const connectionResistance = res.getTotalResistance(this, { ...options, forParrallel: 1 })
            if (connectionResistance !== 0) {
                resistancetotal += 1 / connectionResistance;
            }
        })
        if (resistancetotal == 0) {
            return 0
        }
        this.resistance = 1 / resistancetotal;
        return this.resistance + this.outC.getTotalResistance(this, options)
    }
    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (from == this.outC) {
            return this.restCurrent
        }
        this.voltageDrop = (options.current * this.resistance)

        this.restCurrent = this.outC.pushCurrent({
            ...options
            , voltage: options.voltage - this.voltageDrop
        }, this);

        const subCurrents = this.containers.map(container => container.inC.pushCurrent({
            ...options, voltage: options.voltage - this.voltageDrop
        }, this))
        debugger;

        return this.restCurrent;
    }


    getStructure() {
        return this.containers.map(container => container instanceof ControlCollection ? container.getStructure() : container)
    }

    static fromJSON(json: any, map: Record<string, FromJson>, context: FromJsonOptions): Wire {

        debugger;
        return null
    };
}