/* tslint:disable:no-unused-variable */

import { Wire } from './wirings/wire';
import { Battery } from './wirings/battery';
import { Resistor } from './wirings/resistor';
import { Parrallel } from './wirings/parrallel';
import { Relay } from './wirings/relay';
import { LED } from './wirings/led';

describe('WiringComponent', () => {

    it('serial resistor circuit', () => {
        const battery = new Battery(12, Infinity)
        ///   const b2 = new Battery()
        battery.enabled = true
        const resistor = new Resistor(2)
        const resistor3 = new Resistor(3)
        const resistor5 = new Resistor(5)
        // battery.controlContainer.addNodes()
        ///  battery.controlContainer.connectContainerNodes();
        //battery.connectTo(battery.controlContainer)

        Wire.connectNodes(battery, resistor, resistor3, resistor5, battery)


        expect(battery.getTotalResistance(null, {})).toBe(10)
        battery.checkContent(1)
        expect(resistor.voltageDrop).toBe(2.4)
        expect(+resistor3.voltageDrop.toPrecision(3)).toBe(3.6)
        expect(+resistor5.voltageDrop.toPrecision(3)).toBe(6)
        //expect(+battery.controlContainer.blockDrop.toPrecision(3)).toBe(12)
    });
    it('parrallel resistor circuit', () => {
        const battery = new Battery(6, Infinity)
        battery.enabled = true
        ///   const b2 = new Battery()


        const resistor = new Resistor(2)
        const resistor3 = new Resistor(4)



        const parrallelblock = new Parrallel(resistor, resistor3)
        const resistor5 = new Resistor(5)
        //
        //   battery.connectTo(battery.controlContainer)
        //  battery.controlContainer.addNodes(parrallelblock, resistor5)
        Wire.connectNodes(battery, parrallelblock, resistor5, battery)
        //  battery.controlContainer.connectContainerNodes();


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

        // battery.controlContainer.addNodes(resistor5, parrallelblock)
        Wire.connectNodes(battery, resistor5, parrallelblock, battery)
        // battery.controlContainer.connectContainerNodes();
        //expect(+battery.getTotalResistance(null).toPrecision(3)).toBe(1.33)
        battery.checkContent(1)
        expect(+resistor5.voltageDrop.toPrecision(3)).toBe(4.74)
        expect(+parrallelblock.voltageDrop.toPrecision(3)).toBe(1.26)
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

        // batteryControl.connectTo(batteryControl.controlContainer)
        //batteryControl.controlContainer.addNodes(relay)
        Wire.connectNodes(batteryControl, relay, batteryControl)
        //batteryControl.controlContainer.connectContainerNodes();

        debugger;
        constrolledBattery.checkContent(1);

        expect(testLed.brightness).toBe(0);
        expect(testLed.blown).toBe(false);


        //expect(+battery.getTotalResistance(null).toPrecision(3)).toBe(1.33)
        relay.setSwitchOneEnabled(true)
        debugger;
        batteryControl.checkContent(1)
        constrolledBattery.checkContent(1);


        expect(testLed.blown).toBe(false);
        expect(testLed.brightness).toBe(100)
    });
});
