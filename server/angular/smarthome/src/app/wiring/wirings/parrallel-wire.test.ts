import { Battery } from './battery';
import { Collection } from './collection';
import { ParrallelWire } from './parrallel-wire';
import { Resistor } from './resistor';
import { Wire } from './wire';

function connectParralel(...nodes: Array<Array<Collection>>): [ParrallelWire, ParrallelWire] {
  const parrallelStart = new ParrallelWire()
  const parrallelEnd = new ParrallelWire()

  nodes.forEach(connectedSet => {
    Wire.connectNodes(...connectedSet)
    parrallelStart.newOutC(connectedSet[0].inC)
    parrallelEnd.newInC(connectedSet[connectedSet.length - 1].outC)
  })
  return [parrallelStart, parrallelEnd];
}

describe("parrallel wire", () => {

  it('parrallel wire circuit', () => {
    const battery = new Battery(6, Infinity)
    battery.enabled = true
    ///   const b2 = new Battery()
    //           bat 6V
    //            |
    //           / \
    //          |   |
    //          4   2
    //          |   |
    //           \ / 
    //            | 
    //            5
    //            |

    const resistor_2 = new Resistor(2)
    const resistor_4 = new Resistor(4)

    const [parrallelStart, parrallelEnd] = connectParralel([resistor_2], [resistor_4])

    const resistor_5 = new Resistor(5)

    Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor_5, battery)

    expect(+battery.getTotalResistance(null, {}).resistance.toPrecision(3)).toBe(6.33)
    battery.checkContent(1)
    expect(+resistor_5.voltageDrop.toPrecision(3)).toBe(4.74)
    expect(+parrallelStart.resistance.toPrecision(3)).toBe(1.33)
    expect(+parrallelStart.voltageDrop.toPrecision(3)).toBe(1.26)
    const resistorCurrents = {
      2: +resistor_2.incomingCurrent.current.toPrecision(3),
      4: +resistor_4.incomingCurrent.current.toPrecision(3),
      5: +resistor_5.incomingCurrent.current.toPrecision(3),
    }
    expect(resistorCurrents).toEqual({
      "2": 0.474,  // seems about right oO
      "4": 0.237,
      "5": 0.947
    })
    // TODO verify
    //expect(+resistor.voltageDrop.toPrecision(3)).toBe(1.89)
    // expect(+resistor3.voltageDrop.toPrecision(3)).toBe(3.79)
  });


  it("parrallel shorting", () => {
    const battery = new Battery(6, Infinity)
    battery.enabled = true
    ///   const b2 = new Battery()


    const resistor = new Resistor(3)
    const resistor3 = new Resistor(0)

    const [parrallelStart, parrallelEnd] = connectParralel([resistor], [resistor3])

    const resistor5 = new Resistor(3)
    Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor5, battery)


    expect(+battery.getTotalResistance(null, {}).resistance.toPrecision(3)).toBe(3)

    battery.checkContent(1)
    expect(+resistor5.voltageDrop.toPrecision(3)).toBe(6)
    // expect(+parrallelStart.voltageDrop.toPrecision(3)).toBe(1.26)
    const resistorCurrents = {
      3: +resistor.incomingCurrent.current.toPrecision(3),
      0: +resistor3.incomingCurrent.current.toPrecision(3),
      5: +resistor5.incomingCurrent.current.toPrecision(3),
    }
    //also seems to be right
    expect(resistorCurrents).toEqual({
      "3": 0,
      "0": 2,
      "5": 2
    })
  })



  it("runs with nested parrallel connection", () => {
    const battery = new Battery(6, Infinity)
    battery.enabled = true
    ///   const b2 = new Battery()

    //           bat 6V
    //            |
    //           / \
    //          |   |
    //          4  / \
    //          | 10 10
    //          |  \ /
    //           \ / 
    //            | 
    //            5
    //

    const resistor_4 = new Resistor(4)


    const resistor_10 = new Resistor(10)
    const resistor_10b = new Resistor(10)
    const innerParrallel = connectParralel([resistor_10], [resistor_10b])

    const innerCol = new Collection(innerParrallel[0].newInC(), innerParrallel[1].newOutC())
    const [parrallelStart, parrallelEnd] = connectParralel([innerCol], [resistor_4])


    const resistor_5 = new Resistor(5)
    Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor_5, battery)

    expect(+battery.getTotalResistance(null, {}).resistance).toBeDefined()

    // yes i mesured this example with the multimeter 10 10 in parralel yields only 5ohm
    expect(+innerParrallel[0].resistance.toPrecision(3)).toBe(5);
  })
})