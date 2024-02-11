import { Connection } from './connection';
import type { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn } from './wiring.a';
import { Wiring } from './wiring.a';
import { v4 } from "uuid"
import { Battery } from './battery';
import type { FromJsonOptions } from '../serialisation';
import { Wire } from './wire';
import type { RegisterOptions } from './interfaces/registration';
import { noConnection } from './resistance-return';

export class ParrallelWire extends Wiring {


  outC: Array<Connection> = []

  outCResistancePrecentageMap = new Map<Connection, number>()

  inC: Array<Connection> = []
  resistance: number;
  restCurrent: CurrentCurrent;
  voltageDrop: number;

  lastTriggerTimestamp;

  instance = v4()
  resistancetotal: number;

  getTotalResistance(from: Wiring, options: GetResistanceOptions): ResistanceReturn {
    if (!this.outC.length) {
      return noConnection()
    }

    let parrallelIndex = options.forParrallel;
    if (this.inC.length > 1) {
      parrallelIndex--;
    }

    /* if (this.inC.length > 0 && options.forParrallel == 1) {
      if (this.outC.length > 1) {
        throw new Error("not implemented")
      }
      const resistanceAfterBlock = this.outC[0].getTotalResistance(this, { ...options, forParrallel: options.forParrallel - 1 });
      return {
        resistance: 0,
        afterBlock: [...resistanceAfterBlock.afterBlock, resistanceAfterBlock]
      }
    }*/

    this.resistancetotal = 0
    let resistanceAfter: Array<ResistanceReturn> | "NaN"
    this.outC.forEach(res => {
      const connectionResistance = res.getTotalResistance(this, {
        ...options,
        forParrallel: parrallelIndex + 1
      })

      if (connectionResistance.resistance !== 0) {
        this.outCResistancePrecentageMap.set(res, 1 / connectionResistance.resistance)
        this.resistancetotal += 1 / connectionResistance.resistance;
      } else {
        this.resistancetotal += Infinity
        this.outCResistancePrecentageMap.set(res, Infinity)
      }
      if (!resistanceAfter && connectionResistance.afterBlock) {
        resistanceAfter = connectionResistance.afterBlock
      }
      if (isNaN(connectionResistance.resistance) && resistanceAfter === undefined) {
        resistanceAfter = "NaN"
      }
    })
    if (resistanceAfter == "NaN") {
      return noConnection()
    }
    this.resistance = 1 / this.resistancetotal;
    if (this.inC.length > 1) {
      resistanceAfter.push({
        resistance: this.resistance,
        afterBlock: []
      })
    }

    if (this.resistancetotal == 0 || this.inC.length > 1) {
      return {
        resistance: 0,
        afterBlock: resistanceAfter
      }
    }
    const resistanceAfterEl = resistanceAfter.pop()
    //return this.resistance + this.outC.getTotalResistance(this, options)

    return {
      ...resistanceAfter,
      resistance: resistanceAfterEl.resistance + this.resistance,
      afterBlock: resistanceAfter
    }
  }

  pushCurrent(options: CurrentOption): CurrentCurrent {
    if (this.inC.length > 1) {
      if (this.outC.length > 1) {
        throw new Error("not implemented")
      }

      if (!this.lastTriggerTimestamp || this.lastTriggerTimestamp !== options.triggerTimestamp) {
        this.lastTriggerTimestamp = options.triggerTimestamp
        this.restCurrent = this.outC[0].pushCurrent({
          ...options
          , current: options.currentAfterBlock,
          voltage: options.voltageAfterBlock
        }, this);
        this.restCurrent = {
          ...this.restCurrent,
          afterBlockCurrent: [...this.restCurrent.afterBlockCurrent, this.restCurrent]

        }
      }
      return this.restCurrent
    }
    this.voltageDrop = (options.current * this.resistance)
    const rstCurrent = this.outC.map(container => {
      const voltage = options.voltage
      const percentage = this.outCResistancePrecentageMap.get(container)
      let current;
      if (isFinite(this.resistancetotal)) {
        current = options.current * (percentage)
      } else if (isFinite(percentage)) {
        current = 0
      } else {
        current = options.current
      }
      // const connectionCurrent = this.
      return container.pushCurrent({
        ...options,
        current: current,
        voltage: voltage,
        currentAfterBlock: options.current,
        voltageAfterBlock: voltage - this.voltageDrop
      }, this);
    }).reduce((col, cur) => {
      if (cur?.afterBlockCurrent) {
        return cur.afterBlockCurrent.pop()
      }
      return col
    }, null)

    // in case its not completely connected
    if (rstCurrent == null) {
      return null
    }
    return {
      ...rstCurrent,
      voltage: rstCurrent.voltage
    };
  }

  newInC(connection?: Connection) {
    if (!connection) {
      connection = new Connection(this, "parralel_in_" + this.inC.length);
    } else {
      connection.connectedTo = this;
    }
    this.inC.push(connection)
    return connection
  }


  connect(connection: Connection) {
    return this.newOutC(connection)
  }
  newOutC(connection?: Connection) {
    if (!connection) {
      connection = new Connection(this, "parralel_out_" + this.outC.length);
    } else {
      connection.connectedTo = this;
    }
    this.outC.push(connection)
    // connection.connectedTo = this
    return connection
  }

  register(options: RegisterOptions) {
    options.nodes.push(this)

    const nodes = this.outC.map(c => {
      const parrallelNodes = []
      c.register({ ...options, from: this, nodes: parrallelNodes });
      //options.nodes.push(parrallelNodes)
      return parrallelNodes
    })

    if (this.outC.length == 1) {
      options.nodes.push(...nodes[0])
      return
    }
    const inversNodes = []
    let i = 0;
    while (true) {
      i++
      if (i > 1000) {
        throw new Error("counted too high")
      }
      const lastNodes = nodes.map(subNOdes => subNOdes[subNOdes.length - 1])
      let same = true
      let node
      for (let outNode of lastNodes) {
        if (node === undefined) {
          node = outNode
        } else if (node !== outNode) {
          same = false
          break;
        }
      }
      if (same) {
        inversNodes.push(lastNodes[0])
        nodes.forEach(nodeAr => nodeAr.pop())
      } else {
        break;
      }
    }
    inversNodes.reverse()
    options.nodes.push(nodes)
    options.nodes.push(...inversNodes)
  }


  toJSON() {
    return {
      type: this.constructor.name,
      uuid: this.instance,
      outC: this.outC.map(c => c.parent instanceof Battery ? "BatteryRef" : c.parent)
    }
  }

  public setControlRef(controlRef: Array<ParrallelWire>, key) {
    const inMap = {}
    const outMap = {}

    this.inC.forEach(c => {
      if ("uuid" in c.parent) {
        inMap[c.parent["uuid"] as string] = c
      }
    })
    this.outC.forEach(c => {
      if ("uuid" in c.parent) {
        outMap[c.parent["uuid"] as string] = c
      }
    })
    controlRef.forEach(c => {
      c.inC.forEach(iC => {
        if (!inMap[iC.parent?.["uuid"]] || !iC.parent?.["uuid"]) {
          this.newInC(iC)
          inMap[iC.parent?.["uuid"]] = iC
        } else {
        }
      })
      c.outC.forEach(outC => {
        if (!outMap[outC.parent?.["uuid"]] || !outC.parent?.["uuid"]) {
          this.newOutC(outC)
          outMap[outC.parent?.["uuid"]] = outC
        }
      })
    })
  }

  static fromJSON(json: any, context: FromJsonOptions): Wire {
    const wire = new ParrallelWire()
    wire.instance = json.uuid
    wire.newInC(context.inC)


    let returnWire = null

    if (context.controllerRefs[json.uuid]) {
      context.controlRefs[json.uuid] ??= []
      context.controlRefs[json.uuid].push(wire)
    } else {
      context.controllerRefs[json.uuid] = wire
    }

    for (const out of json.outC) {

      if (out == "BatteryRef") {
        returnWire = wire;
        continue
      }
      const connected = context.elementMap[out.type].fromJSON(out, { ...context, wire: wire })
      if (!returnWire) {
        returnWire = connected
      }
    }
    if (!returnWire) {
      const tWire = new Wire()
      tWire.connect(wire.newOutC())
      return tWire
    }
    return returnWire
  }
}
