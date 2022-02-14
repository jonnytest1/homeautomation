/* tslint:disable:no-unused-variable */

import { Wire } from './wirings/wire';
import { Battery } from './wirings/battery';
import { Resistor } from './wirings/resistor';
import { Parrallel } from './wirings/parrallel';
import { SerialConnected } from './wirings/serial-block';

describe('WiringComponent', () => {

    it('serial resistor circuit', () => {
        const battery = new Battery(12, Infinity)
        ///   const b2 = new Battery()
        battery.enabled = true
        const resistor = new Resistor(2)
        const resistor3 = new Resistor(3)
        const resistor5 = new Resistor(5)

        const sC = new SerialConnected(resistor, resistor3, resistor5)

        Wire.connect(battery.connectionProvide, sC.inC)
        Wire.connect(sC.outC, battery.connectionConsume)

        expect(battery.getTotalResistance(null, {})).toBe(10)
        battery.checkContent(1)
        expect(resistor.voltageDrop).toBe(2.4)
        expect(+resistor3.voltageDrop.toPrecision(3)).toBe(3.6)
        expect(+resistor5.voltageDrop.toPrecision(3)).toBe(6)
        expect(+sC.blockDrop.toPrecision(3)).toBe(12)
    });
    it('parrallel resistor circuit', () => {
        const battery = new Battery(6, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()


        const resistor = new Resistor(2)
        const resistor3 = new Resistor(4)



        const parrallelblock = new Parrallel(resistor, resistor3)
        const resistor5 = new Resistor(5)

        const sC = new SerialConnected(parrallelblock, resistor5)

        Wire.connect(battery.connectionProvide, sC.inC)
        Wire.connect(sC.outC, battery.connectionConsume)

        //expect(+battery.getTotalResistance(null).toPrecision(3)).toBe(1.33)
        battery.checkContent(1)
        expect(+resistor5.voltageDrop.toPrecision(3)).toBe(4.74)
        expect(+parrallelblock.voltageDrop.toPrecision(3)).toBe(1.26)
    });
    it('parrallel resistor circuit', () => {
        const battery = new Battery(6, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()


        const resistor = new Resistor(2)
        const resistor3 = new Resistor(4)


        debugger

        const parrallelblock = new Parrallel(resistor, resistor3)
        const resistor5 = new Resistor(5)

        const sC = new SerialConnected(resistor5, parrallelblock)

        Wire.connect(battery.connectionProvide, sC.inC)
        Wire.connect(sC.outC, battery.connectionConsume)

        //expect(+battery.getTotalResistance(null).toPrecision(3)).toBe(1.33)
        battery.checkContent(1)
        expect(+resistor5.voltageDrop.toPrecision(3)).toBe(4.74)
        expect(+parrallelblock.voltageDrop.toPrecision(3)).toBe(1.26)
    });
});
