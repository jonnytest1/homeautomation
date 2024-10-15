import { CurrentCurrent, CurrentOption, GetResistanceOptions, ResistanceReturn, Wiring } from '../wiring.a';
import { v4 } from "uuid"
import { Connection } from '../connection';
import type { RegisterOptions, REgistrationNode } from '../interfaces/registration';
import { v4 as uuid } from 'uuid';
import { Battery } from '../battery';
import { noConnection, noResistance } from '../resistance-return';
import { Collection } from '../collection';
import { JsonSerializer, type FromJsonOptions } from '../../serialisation';
import { MicroPythonExecuter } from './micropython-lib/executer';
export type PinMode = "OUT" | "IN"
export class PiPico extends Collection {



  controlRef = v4()
  pinList = new Array(40).fill(undefined).map((u, i) => new Connection(this, `pico_con_array_${i}`))

  script = ``


  started = false

  tagMap = {
    inputPwr: [
      40, 39, //5v
      36//3V
    ],
    ground: [
      3, 8, 13, 18, 38, 33, 28, 23
    ]
  }


  pinMap: {
    [pin: number]: {
      con: Connection,
      outputValue: number
      mode: PinMode | "off"
    }
  } = {}

  reversePinMap: Map<Connection, number> = new Map()
  resistancetotal: number;
  outCResistancePrecentageMap = new Map<Connection, number>()

  operationResistance = 10
  voltageDrop: number;
  lastTriggerTimestamp: number;
  selfresolved: boolean;
  batteryConnection: Connection;
  restCurrent: CurrentCurrent;
  inputs: Connection[];
  outputs: Connection[];

  registerTimestamp: number;


  instanceUuid = uuid();
  topLevelNodes: REgistrationNode[];

  jsonActive = false
  jsonStringifyTs: number;
  resistance: number;
  static jsonRefPinId: number;
  executer: MicroPythonExecuter;


  constructor() {
    super(null, null)
    // 10, "pipico"
    for (let pinIndex = 0; pinIndex < this.pinList.length; pinIndex++) {
      const pin = this.pinList[pinIndex]
      //pin.controlRef = this.controlRef
    }

    for (const sw of this.pinList) {
      //  sw.enabled = true
      this.pinMap[sw.id] = {
        sw: sw
      }
    }
    this.inputs = this.pinList.slice(0, 20)
    this.outputs = this.pinList.slice(20)

    for (let inputI = 0; inputI < this.inputs.length; inputI++) {
      const inpt = this.inputs[inputI]
      // connectionWire.name = `${40 - inputI}-inputwire-${inpt.name}`
      inpt.parent = this
      //connectionWire.outC = this
      this.pinMap[40 - inputI] = {
        con: inpt,
        mode: "off",
        outputValue: 0
      }
      // inpt.name = `pin-${40 - inputI}`
      this.reversePinMap.set(inpt, 40 - inputI)
    }

    for (let outputI = 0; outputI < this.outputs.length; outputI++) {
      const output = this.outputs[outputI]
      // output.inC.connectedTo = new Wire()
      //  output.inC.connectedTo.inC = this
      //  output.name = `pin-${outputI + 1}`
      output.parent = this

      this.pinMap[outputI + 1] = {
        con: output,
        "mode": "off",
        outputValue: 0
      }
      this.reversePinMap.set(output, outputI + 1)
    }


    for (const pin of this.tagMap.inputPwr) {
      // this.pinMap[pin].con.enabled = true
    }
    for (const pin of this.tagMap.ground) {
      this.pinMap[pin].mode = "OUT"
    }


    this.executer = new MicroPythonExecuter(this)
  }
  updateCode(newCoe: string) {
    this.script = newCoe
    this.executer.update(newCoe)
  }



  getId(con: Connection) {
    return this.reversePinMap.get(con)
  }

  getTotalResistance(from: Wiring | null, options: GetResistanceOptions): ResistanceReturn {
    options.addStep(this)

    const fromPin = this.reversePinMap.get(from as Connection)
    if (this.tagMap.inputPwr.includes(fromPin)) {
      let parrallelIndex = options.forParrallel;

      parrallelIndex--;


      this.resistancetotal = 0
      let resistanceAfter: Array<ResistanceReturn> | "NaN"

      for (const pinid in this.pinMap) {
        const pin = this.pinMap[pinid]

        if (pin.mode === "OUT") {
          this.selfresolved = false
          const connectionResistance = pin.con.getTotalResistance(this, {
            ...options,
            forParrallel: parrallelIndex + 1
          })
          if (isNaN(connectionResistance.resistance)) {
            continue
          }

          if (this.tagMap.ground.includes(+pinid)) {
            if (this.selfresolved == false) {
              this.batteryConnection = pin.con
            }
            continue
          }

          if (connectionResistance.resistance !== 0) {
            this.outCResistancePrecentageMap.set(pin.con, 1 / connectionResistance.resistance)
            this.resistancetotal += 1 / connectionResistance.resistance;
          } else {
            this.resistancetotal += Infinity
            this.outCResistancePrecentageMap.set(pin.con, Infinity)
          }
          if (!resistanceAfter && connectionResistance.afterBlock) {
            resistanceAfter = connectionResistance.afterBlock
          }
          if (isNaN(connectionResistance.resistance) && resistanceAfter === undefined) {
            resistanceAfter = "NaN"
          }
        }

      }

      // adding default resistance for operation
      this.resistancetotal += 1 / this.operationResistance



      if (resistanceAfter == "NaN") {
        return noConnection(this)
      }
      this.resistance = 1 / this.resistancetotal;

      /*resistanceAfter.push({
        resistance: this.resistance,
        afterBlock: [],
        steps: [this]
      })*/


      if (this.resistancetotal == 0) {
        return {
          resistance: 0,
          afterBlock: resistanceAfter,
          steps: [this]
        }
      }
      if (!resistanceAfter) {
        if (!this.batteryConnection) {
          this.getBatteryConnection(options);
        }
        resistanceAfter = [this.batteryConnection.getTotalResistance(this, {
          ...options,
          forParrallel: parrallelIndex + 1
        })]
      }
      const resistanceAfterEl = resistanceAfter.pop()
      //return this.resistance + this.outC.getTotalResistance(this, options)

      return {
        ...resistanceAfter,
        resistance: resistanceAfterEl.resistance + this.resistance,
        afterBlock: resistanceAfter,
        steps: [this]
      }
    } else if (this.tagMap.ground.includes(fromPin)) {
      this.selfresolved = true

      if (this.batteryConnection) {
        const resistanceRet = this.batteryConnection.getTotalResistance(this, {
          ...options,
        });

        /*resistanceAfter.push({
          resistance: this.resistance,
          afterBlock: [],
          steps: [this]
        })*/

        return {
          ...noResistance(this),
          afterBlock: [resistanceRet, ...resistanceRet.afterBlock]
        }
      }
      return noResistance(this)
    }



    return noConnection(this)

  }
  private getBatteryConnection(options: GetResistanceOptions) {
    for (const pinid in this.pinMap) {
      const pin = this.pinMap[pinid];

      if (pin.mode === "OUT") {

        this.selfresolved = false
        const connectionResistance = pin.con.getTotalResistance(this, {
          ...options,
          forParrallel: options.forParrallel - 1
        })
        if (isNaN(connectionResistance.resistance)) {
          continue
        }

        if (this.tagMap.ground.includes(+pinid)) {
          if (this.selfresolved == false) {
            this.batteryConnection = pin.con
            return
          }
        }
      }
    }
  }

  pushCurrent(options: CurrentOption, from: Wiring): CurrentCurrent {
    const fromPin = this.reversePinMap.get(from as Connection)


    if (this.tagMap.ground.includes(fromPin)) {
      if (!this.lastTriggerTimestamp || this.lastTriggerTimestamp !== options.triggerTimestamp) {
        this.lastTriggerTimestamp = options.triggerTimestamp
        if (!this.batteryConnection) {
          this.getBatteryConnection({ forParrallel: 1, addStep() {} })
        }
        if (!this.batteryConnection) {

          throw new Error("didnt find power supply durion resistance calculation")
        }
        this.restCurrent = this.batteryConnection.pushCurrent({
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

    if (this.voltageDrop == 0 && this.executer.running) {
      this.executer.kill()
    } else if (!this.executer.running && this.voltageDrop > 0) {
      this.executer.start()
    }

    const rstCurrent = Object.keys(this.pinMap)
      .filter(pinid => !this.tagMap.ground.includes(+pinid))
      .filter(pinid => this.pinMap[pinid].mode === "OUT")
      .map(pinid => {
        const container = this.pinMap[+pinid].con
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
        if (this.pinMap[+pinid].mode === "OUT") {
          let pushVoltage = voltage;
          let pushCurrent = current;
          if (this.pinMap[+pinid].outputValue == 0) {
            pushVoltage = 0
            pushCurrent = 0
          }

          // const connectionCurrent = this.
          return container.pushCurrent({
            ...options,
            current: pushCurrent,
            voltage: pushVoltage,
            currentAfterBlock: options.current,
            voltageAfterBlock: voltage - this.voltageDrop
          }, this);
        }
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


  register(options: RegisterOptions) {

    if (this.registerTimestamp === options.registrationTimestamp) {

      return
    }

    this.registerTimestamp = options.registrationTimestamp;

    const subNodes: Array<REgistrationNode> = [{ name: this.constructor.name }]
    this.topLevelNodes = options.nodes;
    this.topLevelNodes.push(subNodes)

    if (!this.batteryConnection) {
      this.getBatteryConnection({ forParrallel: 1, addStep() {} })
    }


    Object.keys(this.pinMap)
      .filter(pinid => !this.tagMap.ground.includes(+pinid))
      .filter(pinid => this.pinMap[pinid].mode === "OUT")
      .forEach(pinid => {
        const container = this.pinMap[+pinid].con
        if (container != this.batteryConnection) {
          const outputSubNodes: Array<REgistrationNode> = []
          subNodes.push(outputSubNodes)

          container.register({ ...options, from: this, nodes: outputSubNodes })
        }
      })



    this.batteryConnection?.register({ ...options, nodes: this.topLevelNodes, from: this })
  }

  toJSON(from, context) {
    if (!Battery.jsonStringifyTime) {
      throw new Error("deprecated call")
    }
    if (this.jsonStringifyTs === Battery.jsonStringifyTime) {
      return {
        type: this.constructor.name,
        ref: this.instanceUuid,
        pinConnection: this.getId(context.parents.at(-1).outC)
      }
    }


    this.jsonStringifyTs = Battery.jsonStringifyTime
    const con = {}
    if (!this.batteryConnection) {
      this.getBatteryConnection({
        addStep(w) {

        },
      })
    }

    Object.keys(this.pinMap)
      .filter(pinid => !this.tagMap.ground.includes(+pinid))
      .filter(pinid => this.pinMap[pinid].mode === "OUT")
      .forEach(pinid => {
        const pin = this.pinMap[+pinid];

        con[pinid] = {
          connection: pin.con.connectedTo,
          mode: pin.mode,
          outputValue: pin.outputValue
        }
      })

    return {
      type: this.constructor.name,
      uuid: this.instanceUuid,
      code: this.script,
      ui: this.uiNode,
      //instanceof Battery ? "BatteryRef" : c.parent
      connections: con,
      batteryCon: {
        id: this.reversePinMap.get(this.batteryConnection),
        connection: this.batteryConnection.connectedTo
      }
    }
  }


  static fromJSON(json: any, context: FromJsonOptions) {
    if (json.ref) {
      this.jsonRefPinId = json.pinConnection
      return context.wire
    }
    const piPico = new PiPico()
    piPico.instanceUuid = json.uuid
    if (json.code) {
      piPico.script = json.code
    }
    JsonSerializer.createUiRepresation(piPico, json, context)


    context.wire.connect(piPico.pinMap[piPico.tagMap.inputPwr[0]].con)

    for (const connection in json.connections) {

      const con = piPico.pinMap[+connection]
      const conenctionJson = json.connections[connection]
      con.mode = conenctionJson.mode
      con.outputValue = conenctionJson.outputValue
      const endWire = context.elementMap[conenctionJson.connection.type].fromJSON(conenctionJson.connection, { ...context, inC: con.con })
      endWire.connect(piPico.pinMap[PiPico.jsonRefPinId].con)
    }
    const batteryDef = json.batteryCon
    const batteryConnection = piPico.pinMap[batteryDef.id].con


    return context.elementMap[batteryDef.connection.type].fromJSON(batteryDef.connection, { ...context, inC: batteryConnection })

  }

}