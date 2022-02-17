/* tslint:disable:no-unused-variable */

import { Wire } from './wirings/wire';
import { Battery } from './wirings/battery';
import { Resistor } from './wirings/resistor';
import { Parrallel } from './wirings/parrallel';
import { Relay } from './wirings/relay';
import { LED } from './wirings/led';
import { ParrallelWire } from './wirings/parrallel-wire';

describe('WiringComponent', () => {

  it('serial resistor circuit', () => {
    const battery = new Battery(12, Infinity)
    ///   const b2 = new Battery()
    battery.enabled = true
    const resistor = new Resistor(2)
    const resistor3 = new Resistor(3)
    const resistor5 = new Resistor(5)

    Wire.connectNodes(battery, resistor, resistor3, resistor5, battery)


    expect(battery.getTotalResistance(null, {}).resistance).toBe(10)

    battery.checkContent(1)
    expect(resistor.voltageDrop).toBe(2.4)
    expect(+resistor3.voltageDrop.toPrecision(3)).toBe(3.6)
    expect(+resistor5.voltageDrop.toPrecision(3)).toBe(6)
  });
  it('parrallel resistor circuit', () => {
    const battery = new Battery(6, Infinity)
    battery.enabled = true
    ///   const b2 = new Battery()


    const resistor = new Resistor(2)
    const resistor3 = new Resistor(4)



    const parrallelblock = new Parrallel(resistor, resistor3)
    const resistor5 = new Resistor(5)
    Wire.connectNodes(battery, parrallelblock, resistor5, battery)

    battery.checkContent(1)
    expect(+resistor5.incomingCurrent.voltage.toPrecision(3)).toBe(4.74)
    expect(+resistor5.incomingCurrent.current.toPrecision(3)).toBe(0.947)
    expect(+resistor5.voltageDrop.toPrecision(3)).toBe(4.74)
    expect(+resistor.voltageDrop.toPrecision(3)).toBe(1.89)
    expect(+parrallelblock.resistance.toPrecision(3)).toBe(1.33)
    expect(+parrallelblock.voltageDrop.toPrecision(3)).toBe(1.26)
  });
  it('parrallel resistor circuit', () => {
    const battery = new Battery(6, Infinity)
    battery.enabled = true
    ///   const b2 = new Battery()


    const resistor = new Resistor(2)
    const resistor3 = new Resistor(4)


    const parrallelblock = new Parrallel(resistor, resistor3)
    const resistor5 = new Resistor(5)

    // battery.controlContainer.addNodes(resistor5, parrallelblock)
    Wire.connectNodes(battery, resistor5, parrallelblock, battery)
    // battery.controlContainer.connectContainerNodes();
    //expect(+battery.getTotalResistance(null).toPrecision(3)).toBe(1.33)
    expect(+battery.getTotalResistance(null, {}).resistance.toPrecision(3)).toBe(6.33)
    battery.checkContent(1)
    expect(+resistor5.voltageDrop.toPrecision(3)).toBe(4.74)
    expect(+parrallelblock.voltageDrop.toPrecision(3)).toBe(1.26)
    expect(+resistor.voltageDrop.toPrecision(3)).toBe(1.89)
    expect(+resistor3.voltageDrop.toPrecision(3)).toBe(3.79)
  });


  it('test relay resistor circuit', () => {
    const batteryControl = new Battery(6, Infinity)
    batteryControl.enabled = true


    const relay = new Relay()

    const constrolledBattery = new Battery(6, Infinity)
    constrolledBattery.enabled = true
    //constrolledBattery.connectTo(constrolledBattery.controlContainer)
    const testLed = new LED();

    Wire.connectNodes(constrolledBattery, relay.switch1, new Resistor(100), testLed, constrolledBattery);

    ///   const b2 = new Battery()

    relay.setSwitchOneEnabled(false)

    Wire.connectNodes(batteryControl, relay, batteryControl)


    constrolledBattery.checkContent(1);

    expect(testLed.brightness).toBe(0);
    expect(testLed.blown).toBe(false);


    //expect(+battery.getTotalResistance(null).toPrecision(3)).toBe(1.33)
    relay.setSwitchOneEnabled(true)
    batteryControl.checkContent(1)
    constrolledBattery.checkContent(1);


    expect(testLed.blown).toBe(false);
    expect(+testLed.brightness.toPrecision(2)).toBe(12)
  });


  it('parrallel wire circuit', () => {
    const battery = new Battery(6, Infinity)
    battery.enabled = true
    ///   const b2 = new Battery()


    const resistor = new Resistor(2)
    const resistor3 = new Resistor(4)


    const parrallelStart = new ParrallelWire()
    parrallelStart.newOutC(resistor.inC)
    parrallelStart.newOutC(resistor3.inC)

    const parrallelEnd = new ParrallelWire()
    parrallelEnd.newInC(resistor.outC)
    parrallelEnd.newInC(resistor3.outC)

    const resistor5 = new Resistor(5)
    Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor5, battery)

    expect(+battery.getTotalResistance(null, {}).resistance.toPrecision(3)).toBe(6.33)
    battery.checkContent(1)
    expect(+resistor5.voltageDrop.toPrecision(3)).toBe(4.74)
    expect(+parrallelStart.resistance.toPrecision(3)).toBe(1.33)
    expect(+parrallelStart.voltageDrop.toPrecision(3)).toBe(1.26)
    const resistorCurrents = {
      2: +resistor.incomingCurrent.current.toPrecision(3),
      4: +resistor3.incomingCurrent.current.toPrecision(3),
      5: +resistor5.incomingCurrent.current.toPrecision(3),
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


    const parrallelStart = new ParrallelWire()
    parrallelStart.newOutC(resistor.inC)
    parrallelStart.newOutC(resistor3.inC)

    const parrallelEnd = new ParrallelWire()
    parrallelEnd.newInC(resistor.outC)
    parrallelEnd.newInC(resistor3.outC)

    const resistor5 = new Resistor(3)
    Wire.connectNodes(battery, parrallelStart, parrallelEnd, resistor5, battery)


    expect(+battery.getTotalResistance(null, {}).resistance.toPrecision(3)).toBe(3)

    battery.checkContent(1)
    expect(+resistor5.voltageDrop.toPrecision(3)).toBe(6)
    // expect(+parrallelStart.voltageDrop.toPrecision(3)).toBe(1.26)
    const resistorCurrents = {
      2: +resistor.incomingCurrent.current.toPrecision(3),
      0: +resistor3.incomingCurrent.current.toPrecision(3),
      5: +resistor5.incomingCurrent.current.toPrecision(3),
    }
    //also seems to be right
    expect(resistorCurrents).toEqual({
      "2": 0,
      "0": 2,
      "5": 2
    })
  })
});