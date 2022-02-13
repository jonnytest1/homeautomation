import { threadId } from 'worker_threads';
import { Collection } from './collection';
import { Connection } from './connection';
import { ControlCollection, StrucureReturn } from './control-collection.a';
import { Parrallel as ParrallelConnected } from './parrallel';
import { Resistor } from './resistor';
import { Wire } from './wire';
import { CurrentCurrent, CurrentOption, GetResistanceOptions, Wiring } from './wiring.a';

export class SerialConnected extends ControlCollection implements Wiring {

    nodes: (Collection & Wiring)[];

    constructor(...nodes: Array<Collection & Wiring>) {
        super(null, null)
        this.inC = new Connection(this, "ser_in");
        this.outC = new Connection(this, "ser_out");


        let lastEl = this.inC
        for (let i = 0; i < nodes.length; i++) {

            const currentNode = nodes[i]
            Wire.connect(lastEl, currentNode.inC)
            lastEl = currentNode.outC
        }
        if (lastEl && nodes.length) {
            Wire.connect(lastEl, this.outC)
        }
        this.nodes = nodes;

    }


    resistance: number;

    inVoltage: number

    voltageDrop: number


    private resistanceAfterNodes: number

    public addNode(node: Collection & Wiring) {

        let lastEl = this.inC
        if (this.nodes.length) {
            lastEl = this.nodes[this.nodes.length - 1].outC;
        }
        lastEl.connectedTo = undefined
        Wire.connect(lastEl, node.inC)
        Wire.connect(node.outC, this.outC)
        this.nodes.push(node)

    }



    getTotalResistance(from: Wiring, options: GetResistanceOptions): number {
        if (from == this.outC) {
            this.resistanceAfterNodes = this.outC.getTotalResistance(this, options);
            return this.resistanceAfterNodes
        }
        const resistanceWithNodes = this.inC.getTotalResistance(this, options);
        this.resistance = resistanceWithNodes - this.resistanceAfterNodes
        return resistanceWithNodes
    }
    pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
        if (from == this.outC) {
            //this.voltageDrop = this.inVoltage - options.voltage
            return this.outC.pushCurrent(options, this)
        }
        //this.inVoltage = options.voltage
        this.voltageDrop = (options.current * this.resistance)
        return this.inC.pushCurrent({
            ...options,
            //  voltage: options.voltage - this.voltageDrop
        }, this);

    }
    removeAfter(connectedTo: Wire) {
        const nodes = []
        connectedTo.register({ nodes, until: this.outC, from: this });
        nodes.pop()// self
        nodes.pop() //outC

        for (let i = this.nodes.length - 1; i >= 0; i--) {
            for (const node of nodes) {
                if (this.nodes[i] == node) {
                    this.nodes.splice(i, 1);
                    break;
                }
            }
        }
        let lastEl = this.inC
        if (this.nodes.length) {
            lastEl = this.nodes[this.nodes.length - 1].outC;
        }
        Wire.connect(lastEl, this.outC)
    }
    register(options: { nodes: any[]; until: Wiring; from?: Wiring; }) {
        if (options.from == this.outC) {
            if (this.outC == options.until) {
                options.nodes.push(this)
                return
            }
            return this.outC.register({ ...options, from: this });
        }
        options.nodes.push(this)
        return this.inC.register({ ...options, from: this })
    }

    getStructure(detailed = false): StrucureReturn {
        if (detailed) {
            const nodes = []
            this.register({ nodes, until: this.outC, });
            return nodes;
        }
        return this.nodes.map(node => node instanceof ControlCollection ? node.getStructure() : node);
    }
}